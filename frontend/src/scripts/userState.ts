import { User } from "./models/user.model";


const avatarImg = document.getElementById("user-photo") as HTMLImageElement;

export const UserState = {
	user: null as User | null,
	setUser: (user: User) => {
		UserState.user = user;

		if (avatarImg) {
			avatarImg.onerror = () => {
				avatarImg.onerror = null;
				avatarImg.src = "http://localhost:8080/user/images/default_avatar.png";
			};
			if (user.avatarUrl) {
				avatarImg.src = `http://localhost:8080/user${user.avatarUrl}`;
			} else {
				avatarImg.src = "http://localhost:8080/user//images/default_avatar.png";
			}
		}
	},
	getUser: () => {
		return UserState.user;
	},
	isLoggedIn: () => {
		return UserState.user !== null;
	},
	logout: () => {
		UserState.user = null;
	},
	setUserId: (userId: number) => {
		UserState.user!.id = userId;
	},
	getUserId: () => {
		return UserState.user!.id;
	},
};