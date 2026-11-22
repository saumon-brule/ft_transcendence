import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { RealtimeService } from "../../realtime/realtime.service";
import { PresenceService } from "../presence/presence.service";
import { retryOnWriteConflict } from "../../core/prisma/write-conflict";

@Injectable()
export class FriendsService {
	private readonly logger = new Logger(FriendsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly realtime: RealtimeService,
		private readonly presence: PresenceService,
	) {}

	private async getShortUser(uuid: string) {
		return this.prisma.user.findUniqueOrThrow({ where: { uuid }, select: { uuid: true, username: true } });
	}

	private async notify(task: () => Promise<void>) {
		try {
			await task();
		} catch (error) {
			this.logger.error("Failed to notify a friendship change", error);
		}
	}

	private async notifyAccepted(requesterUUID: string, receiverUUID: string) {
		const [requester, receiver] = await Promise.all([this.getShortUser(requesterUUID), this.getShortUser(receiverUUID)]);
		this.realtime.emitToUser(requester.uuid, "friend:request-accepted", { ...receiver, online: this.presence.isOnline(receiver.uuid) });
		this.realtime.emitToUser(receiver.uuid, "friend:request-accepted", { ...requester, online: this.presence.isOnline(requester.uuid) });
	}

	public async getFriends(userUUID: string) {
		const result = await this.prisma.friendRequest.findMany({
			where: {
				status: "ACCEPTED",
				OR: [
					{ userUUID: userUUID },
					{ friendUUID: userUUID },
				],
			},
			include: {
				user: { select: { uuid: true, username: true } },
				friend: { select: { uuid: true, username: true } },
			},
		});
		return result.map((f) => f.user.uuid === userUUID
			? f.friend
			: f.user);
	}

	public async isFriendWith(userUUID1: string, userUUID2: string) {
		const relations = await this.prisma.friendRequest.findMany({
			where: {
				OR: [
					{ userUUID: userUUID1, friendUUID: userUUID2 },
					{ userUUID: userUUID2, friendUUID: userUUID1 },
				],
			},
			select: { status: true },
		});
		if (relations.some((relation) => relation.status === "ACCEPTED")) {
			return "YES";
		}
		if (relations.some((relation) => relation.status === "PENDING")) {
			return "PENDING";
		}
		return "NO";
	}

	public async makeRequest(userUUID: string, targetUUID: string) {
		if (userUUID === targetUUID) throw new BadRequestException();

		const outcome = await retryOnWriteConflict(() => this.prisma.$transaction(async (tx) => {
			const relations = await tx.friendRequest.findMany({
				where: {
					OR: [
						{ userUUID, friendUUID: targetUUID },
						{ userUUID: targetUUID, friendUUID: userUUID },
					],
				},
			});
			const outgoing = relations.find((relation) => relation.userUUID === userUUID);
			const incoming = relations.find((relation) => relation.userUUID === targetUUID);

			if (relations.some((relation) => relation.status === "ACCEPTED")) return "NONE";

			if (incoming?.status === "PENDING") {
				await tx.friendRequest.update({ where: { id: incoming.id }, data: { status: "ACCEPTED" } });
				if (outgoing) await tx.friendRequest.delete({ where: { id: outgoing.id } });
				return "ACCEPTED";
			}

			if (outgoing?.status === "PENDING") return "NONE";

			if (outgoing) {
				await tx.friendRequest.update({ where: { id: outgoing.id }, data: { status: "PENDING" } });
			} else {
				await tx.friendRequest.create({ data: { userUUID, friendUUID: targetUUID, status: "PENDING" } });
			}
			return "REQUESTED";
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })).catch((error: unknown) => {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
				throw new NotFoundException("User not found");
			}
			throw error;
		});

		if (outcome === "ACCEPTED") {
			await this.notify(() => this.notifyAccepted(targetUUID, userUUID));
		} else if (outcome === "REQUESTED") {
			await this.notify(async () => {
				const requester = await this.getShortUser(userUUID);
				this.realtime.emitToUser(targetUUID, "friend:request-received", requester);
			});
		}
	}

	public async removeFriend(userUUID: string, friendUUID: string) {
		const result = await this.prisma.friendRequest.deleteMany({
			where: {
				status: "ACCEPTED",
				OR: [
					{ userUUID, friendUUID },
					{ userUUID: friendUUID, friendUUID: userUUID },
				],
			},
		});
		if (result.count === 0) throw new NotFoundException();

		this.realtime.emitToUser(friendUUID, "friend:removed", { uuid: userUUID });
	}

	public async manageRequests(userUUID: string, friendUUID: string, status: "ACCEPTED" | "DENIED") {
		await this.prisma.friendRequest.update({
			where: {
				userUUID_friendUUID: {
					userUUID, friendUUID,
				},
				status: "PENDING",
			},
			data: { status: status },
		});

		await this.notify(async () => {
			if (status === "ACCEPTED") {
				await this.notifyAccepted(userUUID, friendUUID);
				return;
			}
			const denier = await this.getShortUser(friendUUID);
			this.realtime.emitToUser(userUUID, "friend:request-denied", denier);
		});
	}
}
