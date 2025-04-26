import { FriendsList } from '../scripts/models/user.model';

export function createGameInvitationModal() {
  // Приватные (в классах) поля станут обычными переменными внутри области видимости.
  let onAccept: (() => void) | null = null;
  let onDecline: (() => void) | null = null;

  // Находим элементы в DOM
  const modal = document.getElementById('gameInvitationModal')!;
  const content = document.getElementById('invitationContent')!;
  const acceptButton = document.getElementById('acceptInvitation')!;
  const declineButton = document.getElementById('declineInvitation')!;
  const closeButton = document.getElementById('closeInvitationModal')!;

  // Функция скрытия
  function hide() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    onAccept = null;
    onDecline = null;
  }

  // Функция показа
  function show(inviter: FriendsList, accept: () => void, decline: () => void) {
    onAccept = accept;
    onDecline = decline;

    content.innerHTML = `
      <div class="flex items-center space-x-4">
        <div class="relative">
            <img src="http://localhost:8080/user${inviter.friend_avatar}"
                 alt="${inviter.friend_username}'s avatar" 
                 class="w-16 h-16 rounded-full object-cover">
            <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        <div>
            <p class="text-gray-900 dark:text-white font-medium">${inviter.friend_username}</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm">invites you to play a game</p>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function onCloseClick() {
      hide();
  }

  function onDeclineClick() {
      if (onDecline) onDecline();
      hide();
  }

  function onAcceptClick() {
      if (onAccept) onAccept();
      hide();
  }

  function onModalClick(e: MouseEvent) {
      if (e.target === modal) {
          hide();
      }
  }

  // Устанавливаем обработчики (аналог метода setupEventListeners в классе)
  function setupEventListeners() {
    closeButton.removeEventListener('click', onCloseClick);
    closeButton.addEventListener('click', onCloseClick);

    declineButton.removeEventListener('click', onDeclineClick);
    declineButton.addEventListener('click', onDeclineClick);

    acceptButton.removeEventListener('click', onAcceptClick);
    acceptButton.addEventListener('click', onAcceptClick);

    modal.removeEventListener('click', onModalClick);
    modal.addEventListener('click', onModalClick);
  }

  setupEventListeners();

  // Возвращаем объект с публичными методами
  return {
    show,
    hide
  };
}