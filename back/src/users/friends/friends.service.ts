import { Injectable, NotFoundException } from "@nestjs/common";
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
	) { }

	public async getStatus(userId: number, friendId: number) {
		const result = await this.prisma.friendRequest.findUnique({
			where: {
				userId_friendId: {
					userId, friendId
				}
			},
		});
		if (!result) throw new NotFoundException();
		return result.status;
	}

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

	public async makeRequest(userId: number, targetId: number) {
		const newRequest = await this.prisma.friendRequest.create({
			data: {
				userId: userId,
				friendId: targetId,
				status: "PENDING"
			},
		});
		return newRequest;
	}

	public async removeFriend(userId: number, friendId: number) {
		await this.prisma.friendRequest.delete({
			where: {
				userId_friendId: {
					userId, friendId
				}
			}
		});
	}

	public async manageRequests(userId: number, friendId: number, status: "ACCEPTED" | "DENIED") {
		await this.prisma.friendRequest.update({
			where: {
				userId_friendId: {
					userId, friendId
				},
				status: "PENDING",
			},
			data: { status: status },
		});
	}

}
