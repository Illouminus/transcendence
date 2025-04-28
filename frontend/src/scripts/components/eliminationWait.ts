import { UserState } from '../userState';

interface MatchCompletePayload {
  gameId: number;
  matchType: string;
  score1: number;
  score2: number;
  winnerId: number;
}

export function renderEliminationWait(match: MatchCompletePayload) {
  const user = UserState.getUser();
  if (!user || user.id === match.winnerId) return;

  // Remove previous modal if exists
  let oldModal = document.getElementById('elimination-wait-modal-bg');
  if (oldModal) oldModal.remove();

  // Modal background
  const modalBg = document.createElement('div');
  modalBg.id = 'elimination-wait-modal-bg';
  modalBg.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70';
  document.body.appendChild(modalBg);

  // Modal window
  const modal = document.createElement('div');
  modal.className = 'relative bg-transparent flex flex-col items-center justify-center w-full max-w-lg mx-auto';
  modalBg.appendChild(modal);

  // Add heart spinner style
  if (!document.getElementById('lds-heart-style')) {
    const style = document.createElement('style');
    style.id = 'lds-heart-style';
    style.innerHTML = `
      .lds-heart, .lds-heart div, .lds-heart div:after, .lds-heart div:before { box-sizing: border-box; }
      .lds-heart { display: inline-block; position: relative; width: 80px; height: 80px; transform: rotate(45deg); transform-origin: 40px 40px; }
      .lds-heart div { top: 28px; left: 28px; position: absolute; width: 32px; height: 32px; background: #a78bfa; animation: lds-heart 1.2s infinite cubic-bezier(0.215,0.61,0.355,1); }
      .lds-heart div:after, .lds-heart div:before { content: " "; position: absolute; display: block; width: 32px; height: 32px; background: #a78bfa; }
      .lds-heart div:before { left: -24px; border-radius: 50% 0 0 50%; }
      .lds-heart div:after { top: -24px; border-radius: 50% 50% 0 0; }
      @keyframes lds-heart {
        0% { transform: scale(0.95); }
        5% { transform: scale(1.1); }
        39% { transform: scale(0.85); }
        45% { transform: scale(1); }
        60% { transform: scale(0.95); }
        100% { transform: scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }

  // Heart spinner
  const spinner = document.createElement('div');
  spinner.innerHTML = `<div class="lds-heart"><div></div></div>`;
  spinner.className = 'mb-8';
  modal.appendChild(spinner);

  // Title
  const title = document.createElement('h2');
  title.className = 'text-2xl font-extrabold text-center text-purple-300 mb-2';
  title.textContent = 'You are out of the tournament';
  modal.appendChild(title);

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.className = 'text-lg text-center text-gray-200 mb-4';
  subtitle.textContent = 'Please wait for the final to finish to see the results.';
  modal.appendChild(subtitle);
}

export function removeEliminationWait() {
  const modalBg = document.getElementById('elimination-wait-modal-bg');
  if (modalBg) {
    modalBg.classList.remove('opacity-100');
    modalBg.classList.add('opacity-0');
    setTimeout(() => { modalBg.remove(); }, 600);
  }
}

// For best effect, add to tailwind.config.js:
// animation: {
//   ...
//   'spin-slow': 'spin 2.5s linear infinite',
//   'dot-bounce1': 'dotBounce 1.2s infinite 0s',
//   'dot-bounce2': 'dotBounce 1.2s infinite 0.2s',
//   'dot-bounce3': 'dotBounce 1.2s infinite 0.4s',
//   'pulse-slow': 'pulse 2.5s infinite',
// },
// keyframes: {
//   ...
//   dotBounce: {
//     '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.3 },
//     '40%': { transform: 'translateY(-10px)', opacity: 1 },
//   },
// } 