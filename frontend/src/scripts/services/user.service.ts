import { User } from "../models/user.model";
import { showAlert } from "./alert.service";
import { UserState } from "../userState";
import { loadSettingsPage } from "../loaders/loaders";
import { setUpdateAvatar } from "../loaders/outils";
import { AUTH_URL, BASE_URL, USER_URL } from "../outils/config";


export async function fetchUserProfile(): Promise<User | null> {
    try {
        const res = await fetch(`${BASE_URL}/aggregated/profile`, { credentials: "include" });
        console.log("Response from user profile fetch:", res);
        if (res.ok) {
            //console.log("User profile fetched successfully", await res.json());
            const user: User = await res.json();
            console.log("User profile fetched successfully", user);
            return user;
        }
        if(res.status === 401) {
          UserState.logout();
          localStorage.removeItem("token");
          return null;
        }

        return null;
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        showAlert("Error fetching user profile: " + error.message, "danger");
        return null;
    }
}



// Function to handle the user profile update form submission
// This function gets the username, email and password from the form
// And sends it to the backend to update the user profile
// If the update is successful, we show an alert and reload the settings page
// If the update fails, we show an alert with the error message
export async function handleUpdateProfile(e: Event): Promise<void> {
    e.preventDefault();
  
    const username = (document.getElementById("username") as HTMLInputElement).value.trim();
    const email = (document.getElementById("profile-email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("password") as HTMLInputElement).value;
  
    if (!username) {
      showAlert("Username is required", "danger");
      return;
    }
    if (!email) {
      showAlert("Email is required", "danger");
      return;
    }
  
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    if (password) {
      formData.append("password", password);
    }
  
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Updating...";
    }
  
    try {
      const res = await fetch(`${AUTH_URL}/update`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Update failed: ${res.statusText}`);
      }
  
      showAlert("Update was successful", "success");
  
      const updatedUser = await fetchUserProfile();
      if (updatedUser) {
        UserState.updateUser(updatedUser);
      }
      await loadSettingsPage();
    } catch (error: any) {
      showAlert("Update error: " + error.message, "danger");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Save Changes";
      }
    }
  }



  export async function handleUpdateAvatar(e: Event): Promise<void> {
	e.preventDefault();
	const avatarInput = document.getElementById("avatar-update") as HTMLInputElement;
	console.log("Avatar input:", avatarInput);

	if (avatarInput.files && avatarInput.files[0]) {
	  const file = avatarInput.files[0];
	  
	  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
	  if (!validTypes.includes(file.type)) {
		showAlert("Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.", "danger");
		return;
	  }
	  
	  const maxSize = 5 * 1024 * 1024; 
	  if (file.size > maxSize) {
		showAlert(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`, "danger");
		return;
	  }
	}
  
	const formData = new FormData();
	
	if (avatarInput.files && avatarInput.files[0]) {
	  formData.append("avatar", avatarInput.files[0]);
	}
	const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
	if (submitButton) {
	  submitButton.disabled = true;
	  submitButton.textContent = "Updating...";
	}
  
	try {
	  const res = await fetch(`${USER_URL}/updatePhoto`, {
      method: "POST",
      body: formData,
      credentials: "include",
      });
	  
	  if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.error || `Update failed: ${res.statusText}`);
	  }
	  
		showAlert("Update was successful", "success");
	  
	  const user = await fetchUserProfile();
	  if (user)
		UserState.setUser(user);
	
	  setUpdateAvatar();
	} catch (error: any) {
	  showAlert("Update error: " + error.message, "danger");
	} finally {
	  if (submitButton) {
		submitButton.disabled = false;
		submitButton.textContent = "Save Changes";
	  }
	}
  }



  export async function enable2FA(): Promise<void> {
    try {
      const response = await fetch(`${AUTH_URL}/enable-2fa`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        showAlert("2FA enabled", "success");
        const user = await fetchUserProfile();
        if (user) {
          UserState.updateUser(user);
        }
      }
    } catch (error: any) {
      showAlert("Error enabling 2FA: " + error.message, "danger");
    }
  }


  export async function disable2FA(): Promise<void> {
    try {
      const response = await fetch(`${AUTH_URL}/disable-2fa`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        showAlert("2FA disabled", "success");
        const user = await fetchUserProfile();
        if (user) {
          UserState.updateUser(user); 
        }
      }
    } catch (error: any) {
      showAlert("Error disabling 2FA: " + error.message, "danger");
    }
  }
  
  export async function incrementWins(userId: number, type: 'win' | 'loss'): Promise<void> {
    try {
      const res = await fetch(`${USER_URL}/incrementWins`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, type }),
      });
      if (!res.ok) {
        throw new Error(`Failed to increment ${type}`);
      }
    } catch (error: any) {
      console.error(`Error incrementing ${type}:`, error);
      showAlert(`Error incrementing ${type}: ` + error.message, 'danger');
    }
  }
  