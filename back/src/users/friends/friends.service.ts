import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";

@Injectable()
export class FriendsService {
	constructor(private readonly prisma: PrismaService) {}

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
		const pendingRequest = await this.prisma.friendRequest.findUnique({
			where: {
				userUUID_friendUUID: {
					userUUID: targetUUID,
					friendUUID: userUUID,
				},
			},
		});
		if (pendingRequest?.status === "PENDING") {
			return this.prisma.friendRequest.update({
				where: {
					userUUID_friendUUID: {
						userUUID: targetUUID,
						friendUUID: userUUID,
					},
				},
				data: { status: "ACCEPTED" },
			});
		}
		return this.prisma.friendRequest.upsert({
			where: {
				userUUID_friendUUID: {
					userUUID: userUUID,
					friendUUID: targetUUID,
				},
				status: "DENIED",
			},
			update: { status: "PENDING" },
			create: {
				userUUID: userUUID,
				friendUUID: targetUUID,
				status: "PENDING",
			},
		}).catch((error: unknown) => {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
				throw new NotFoundException("User not found");
			}
			throw error;
		});
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
	}

}
