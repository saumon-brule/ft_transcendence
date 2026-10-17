import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";
import { UsersService } from "../users.service";


// model FriendRequest {
//     id       Int     @id @default(autoincrement())
//     userId   Int     @map("user_id")
//     friendId Int     @map("friend_id")
//     status   String? @map("status")

//     user   User @relation("Requester", fields: [userId], references: [id])
//     friend User @relation("Receiver", fields: [friendId], references: [id])

//     @@unique([userId, friendId])
//     @@map("friendRequests")
// }


@Injectable()
export class FriendsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UsersService,
	) {}

	public async getFriends(userUUID: string) {
		const user = await this.userService.getByUUID(userUUID);
		if (!user) return [];
		const userId = user.id;
		const result = await this.prisma.friendRequest.findMany({
			where: {
				status: "ACCEPTED",
				OR: [
					{ userId: userId },
					{ friendId: userId },
				],
			},
			include: {
				user: { select: { id: true, uuid: true, username: true } },
				friend: { select: { id: true, uuid: true, username: true } },
			},
		});
		return result.map((f) => f.user.id === userId
			? f.friend
			: f.user);
	}

	public async isFriendWith(userUUID1: string, userUUID2: string) {
		const user1 = await this.userService.getByUUID(userUUID1);
		const user2 = await this.userService.getByUUID(userUUID2);
		const relations = await this.prisma.friendRequest.findMany({
			where: {
				OR: [
					{ userId: user1.id, friendId: user2.id },
					{ userId: user2.id, friendId: user1.id },
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

	public async makeRequest(userId: number, targetId: number) {
		if (userId === targetId) throw new BadRequestException();
		const pendingRequest = await this.prisma.friendRequest.findUnique({
			where: {
				userId_friendId: {
					userId: targetId,
					friendId: userId,
				},
			},
		});
		if (pendingRequest?.status === "PENDING") {
			return this.prisma.friendRequest.update({
				where: {
					userId_friendId: {
						userId: targetId,
						friendId: userId,
					},
				},
				data: { status: "ACCEPTED" },
			});
		}
		const newRequest = await this.prisma.friendRequest.create({
			data: {
				userId: userId,
				friendId: targetId,
				status: "PENDING",
			},
		});
		return newRequest;
	}

	public async removeFriend(userId: number, friendId: number) {
		const result = await this.prisma.friendRequest.deleteMany({
			where: {
				status: "ACCEPTED",
				OR: [
					{ userId, friendId },
					{ userId: friendId, friendId: userId },
				],
			},
		});
		if (result.count === 0) throw new NotFoundException();
	}

	public async manageRequests(userId: number, friendId: number, status: "ACCEPTED" | "DENIED") {
		await this.prisma.friendRequest.update({
			where: {
				userId_friendId: {
					userId, friendId,
				},
				status: "PENDING",
			},
			data: { status: status },
		});
	}

}
