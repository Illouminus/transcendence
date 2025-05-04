import { UserState } from '../userState';
import { getUserById } from '../outils/outils';
import { BASE_URL } from '../outils/config';

interface PodiumEntry {
  userId: number;
  place: number;
}

export function renderPodium(podium: PodiumEntry[]) {
  const user = UserState.getUser();
  if (!user) return;

  // Сортируем по месту
  const sorted = [...podium].sort((a, b) => a.place - b.place);

  // Получаем данные для каждого участника
  const podiumData = sorted.map(entry => {
    if (entry.userId === user.id) {
      return {
        username: user.username,
        avatar: user.avatar || '/images/default_avatar.png',
        place: entry.place,
        isCurrent: true,
      };
    } else {
      const friend = getUserById(entry.userId);
      return {
        username: friend?.username || 'Unknown',
        avatar: friend?.avatar_url || '/images/default_avatar.png',
        place: entry.place,
        isCurrent: false,
      };
    }
  });

  // Удаляем предыдущую модалку если есть
  let oldModal = document.getElementById('podium-modal-bg');
  if (oldModal) oldModal.remove();

  // Модальное затемнение
  const modalBg = document.createElement('div');
  modalBg.id = 'podium-modal-bg';
  modalBg.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-500 opacity-0';
  document.body.appendChild(modalBg);
  setTimeout(() => { modalBg.classList.remove('opacity-0'); modalBg.classList.add('opacity-100'); }, 10);

  // Модальное окно
  const modal = document.createElement('div');
  modal.className = 'relative bg-transparent flex flex-col items-center justify-center w-full max-w-3xl mx-auto';
  modalBg.appendChild(modal);

  // Конфетти-эмодзи
  const confetti = document.createElement('div');
  confetti.className = 'absolute top-0 left-1/2 -translate-x-1/2 text-5xl select-none pointer-events-none animate-bounce';
  confetti.innerText = '🎉✨🥳';
  modal.appendChild(confetti);

  // Заголовок
  const title = document.createElement('h2');
  title.className = 'text-5xl font-extrabold text-center text-purple-400 mb-8 drop-shadow-lg animate-fade-in-down';
  title.textContent = '🏆 Championship Podium';
  modal.appendChild(title);

  // Подиум
  const heights = ["h-56", "h-40", "h-32", "h-28"];
  const places = [1, 2, 3, 4];
  const colors = [
    'from-yellow-400 via-yellow-300 to-yellow-500', // 1 место
    'from-gray-300 via-gray-200 to-gray-400',     // 2 место
    'from-orange-400 via-orange-300 to-orange-500', // 3 место
    'from-purple-400 via-purple-300 to-purple-600', // 4 место
  ];
  const shadowGlow = [
    'shadow-[0_0_40px_10px_rgba(251,191,36,0.5)]', // 1
    'shadow-[0_0_30px_5px_rgba(156,163,175,0.3)]', // 2
    'shadow-[0_0_30px_5px_rgba(251,146,60,0.3)]', // 3
    'shadow-[0_0_20px_2px_rgba(168,85,247,0.3)]', // 4
  ];

  const podiumDiv = document.createElement('div');
  podiumDiv.className = 'flex justify-center items-end gap-8 mt-2 mb-10 w-full animate-fade-in-up';

  for (let i = 0; i < podiumData.length; i++) {
    const p = podiumData[i];
    const idx = places.indexOf(p.place);
    const height = heights[idx] || 'h-24';
    const color = colors[idx] || 'from-gray-200 to-gray-400';
    const glow = shadowGlow[idx] || '';

    const card = document.createElement('div');
    card.className = `flex flex-col items-center justify-end relative ${height} w-36 rounded-t-3xl bg-gradient-to-t ${color} ${glow} shadow-2xl transition-all duration-500 scale-90 opacity-0` + (p.isCurrent ? ' ring-4 ring-purple-500 z-20' : ' z-10');
    card.style.transition = 'transform 0.7s cubic-bezier(.68,-0.55,.27,1.55), opacity 0.7s';

    // Аватар
    const avatar = document.createElement('img');
    avatar.src = p.avatar.startsWith('http') ? p.avatar : `${BASE_URL}/user${p.avatar}`;
    avatar.alt = p.username;
    avatar.className = `w-24 h-24 rounded-full border-4 border-white shadow-lg absolute -top-14 bg-white object-cover ${p.isCurrent ? 'ring-4 ring-purple-400' : ''}`;
    avatar.style.opacity = '0';
    avatar.style.transition = 'opacity 0.7s 0.3s';
    card.appendChild(avatar);

    // Имя
    const name = document.createElement('div');
    name.className = `mt-16 text-xl font-bold text-white text-center ${p.isCurrent ? 'text-purple-100' : 'text-white'}`;
    name.textContent = p.username;
    card.appendChild(name);

    // Место
    const place = document.createElement('div');
    place.className = `mt-2 mb-4 px-4 py-1 rounded-full text-lg font-bold ${idx === 0 ? 'bg-yellow-500 text-gray-900' : idx === 1 ? 'bg-gray-300 text-gray-900' : idx === 2 ? 'bg-orange-500 text-white' : 'bg-purple-500 text-white'} drop-shadow-md`;
    place.textContent = `${p.place} place`;
    card.appendChild(place);

    // Медаль
    if (idx === 0) {
      const medal = document.createElement('span');
      medal.className = 'absolute top-2 right-2 text-3xl animate-bounce-slow';
      medal.textContent = '🥇';
      card.appendChild(medal);
    } else if (idx === 1) {
      const medal = document.createElement('span');
      medal.className = 'absolute top-2 right-2 text-3xl animate-bounce-slow';
      medal.textContent = '🥈';
      card.appendChild(medal);
    } else if (idx === 2) {
      const medal = document.createElement('span');
      medal.className = 'absolute top-2 right-2 text-3xl animate-bounce-slow';
      medal.textContent = '🥉';
      card.appendChild(medal);
    }

    podiumDiv.appendChild(card);

    // Анимация появления
    setTimeout(() => {
      card.classList.remove('scale-90', 'opacity-0');
      card.classList.add('scale-100', 'opacity-100');
      avatar.style.opacity = '1';
      if (idx === 0) card.classList.add('animate-bounce-trophy');
    }, 200 + i * 200);
  }

  modal.appendChild(podiumDiv);

  // Анимация исчезновения и удаление через 5 секунд
  setTimeout(() => {
    modalBg.classList.remove('opacity-100');
    modalBg.classList.add('opacity-0');
    setTimeout(() => { modalBg.remove(); }, 600);
  }, 5000);

  // Tailwind кастомные анимации (добавить в tailwind.config.js):
  // animate-fade-in-up, animate-fade-in-down, animate-bounce-trophy, animate-bounce-slow
} 