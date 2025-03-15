import { User } from "./models/user.model";


const avatarImg = document.getElementById("user-photo") as HTMLImageElement;

export const UserState = {
	user: null as User | null,
	setUser: (user: User) => {
		UserState.user = user;
		renderAvatar(user.avatar);
	},
	updateUser: (partial: Partial<User>) => {
		if (UserState.user) {
			UserState.user = { ...UserState.user, ...partial };
			renderAvatar(UserState.user.avatar);
		  }
	},
	getUser: () => UserState.user,
	isLoggedIn: () => UserState.user !== null,
	logout: () => {
	  UserState.user = null;
	  renderAvatar(null);
	},
};


function renderAvatar(avatar?: string | null) {
	const avatarImg = document.getElementById("user-photo") as HTMLImageElement;
	if (avatarImg) {
	  avatarImg.onerror = () => {
		avatarImg.onerror = null;
		avatarImg.src = "http://localhost:8080/user/images/default_avatar.png";
	  };
	  avatarImg.src = avatar ? `http://localhost:8080/user${avatar}` : "http://localhost:8080/user/images/default_avatar.png";
	}
  }