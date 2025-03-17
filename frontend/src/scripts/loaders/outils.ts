import {UserState} from "../userState";


export async function fetchAndRender(page: string) {
	const response = await fetch(`./src/pages/${page}.html`);
	if (!response.ok) throw new Error(`Error loading ${page}`);
	document.getElementById("app")!.innerHTML = await response.text();
}



export const succesSVG =  
`
<svg class="text-green-500 w-6 h-6" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
  <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export const errorSVG = 
`
<svg class="text-red-500 w-6 h-6" viewBox="0 0 64 64" fill="currentColor">
	<path d="M32.085,56.058c6.165,-0.059 12.268,-2.619 16.657,-6.966c5.213,-5.164 7.897,-12.803 6.961,-20.096c-1.605,-12.499 -11.855,-20.98 -23.772,-20.98c-9.053,0 -17.853,5.677 -21.713,13.909c-2.955,6.302 -2.96,13.911 0,20.225c3.832,8.174 12.488,13.821 21.559,13.908c0.103,0.001 0.205,0.001 0.308,0Zm-0.282,-4.003c-9.208,-0.089 -17.799,-7.227 -19.508,-16.378c-1.204,-6.452 1.07,-13.433 5.805,-18.015c5.53,-5.35 14.22,-7.143 21.445,-4.11c6.466,2.714 11.304,9.014 12.196,15.955c0.764,5.949 -1.366,12.184 -5.551,16.48c-3.672,3.767 -8.82,6.016 -14.131,6.068c-0.085,0 -0.171,0 -0.256,0Zm-12.382,-10.29l9.734,-9.734l-9.744,-9.744l2.804,-2.803l9.744,9.744l10.078,-10.078l2.808,2.807l-10.078,10.079l10.098,10.098l-2.803,2.804l-10.099,-10.099l-9.734,9.734l-2.808,-2.808Z"/>
</svg>
`
;



export async function setUpdateAvatar() {
	const user = UserState.getUser();
	console.log("User from state", user);
	let avatar = document.getElementById("profile-avatar") as HTMLImageElement;
	
	if(avatar)
	{
		avatar.onerror = () => {
			avatar.onerror = null;
			avatar.src = "http://localhost:8080/user/images/default_avatar.png";
		};
		if (user?.avatar) {
			avatar.src = `http://localhost:8080/user${user.avatar}`;
		} else {
			avatar.src = "http://localhost:8080/user/images/default_avatar.png";
		}
	}

	return avatar;
}