import type { ProfileType } from '../../types/models';
import { buildAdviceSystemPrompt } from '../systemPrompt';
import type {
  AdviceProvider,
  AdviceReplyRequest,
  AdviceReplyResult,
} from '../types';

/**
 * Offline demo replies follow the same validated Conseils IA rules as the
 * system prompt (short form, 2–4 tips, profile adaptation, crisis redirect).
 */

type Heuristic = {
  keys: string[];
  reply: (profileType?: ProfileType | null) => string;
};

function profileHint(profileType?: ProfileType | null): string {
  if (profileType === 'ALZHEIMER') {
    return 'Profil Alzheimer : validation et routine plutôt que contradiction.';
  }
  if (profileType === 'TSA_TDAH') {
    return 'Profil TSA/TDAH : baissez les stimulations ; une seule consigne à la fois.';
  }
  if (profileType === 'MIXED') {
    return 'Profil mixte : confusion (mémoire) ou surcharge sensorielle ? Adaptez en conséquence.';
  }
  return 'Adaptez selon ce que vous observez chez votre proche.';
}

const HEURISTICS: Heuristic[] = [
  {
    keys: [
      'suicide',
      'suicidaire',
      'me tuer',
      'en finir',
      '3114',
    ],
    reply: () =>
      `Votre détresse compte. Si vous ou votre proche êtes en danger immédiat, appelez le 15 ou le 112.\n` +
      `• Pour une crise psychique ou des idées suicidaires : le 3114 (prévention du suicide), 24h/24.\n` +
      `• Mettez-vous à l’abri et, si possible, restez avec quelqu’un de confiance.\n` +
      `• Aid'Ami n’assure pas de suivi clinique ni d’urgence médicale.`,
  },
  {
    keys: [
      'urgence',
      'danger',
      'violence',
      '112',
      '15',
      'se fait mal',
      'agression',
      'malaise',
    ],
    reply: () =>
      `La sécurité passe avant les conseils.\n` +
      `• Danger immédiat ou malaise grave : 15 (SAMU) ou 112.\n` +
      `• Détresse psychologique aiguë : 3114.\n` +
      `• Mettez-vous à l’abri ; Aid'Ami ne gère pas les urgences médicales.`,
  },
  {
    keys: ['crise', 'meltdown', 'surcharge', 'panique', 'agité', 'agitée', 'cri'],
    reply: (profileType) =>
      `Voici des gestes concrets, sans juger la situation :\n` +
      `• Réduisez bruit, lumière et demandes simultanées.\n` +
      `• Restez à une distance rassurante ; une seule phrase courte.\n` +
      `• Proposez un outil simple (casque, objet familier, pièce calme).\n` +
      `• Quand la vague retombe, notez ce qui a aidé.\n` +
      `${profileHint(profileType)} Une question utile : la surcharge est surtout sensorielle, ou liée à trop de consignes ?`,
  },
  {
    keys: [
      'mémoire',
      'oublie',
      'oublié',
      'désorient',
      'ne me reconnaît',
      'confus',
      'confuse',
    ],
    reply: (profileType) =>
      `Quelques pistes calmes pour la confusion :\n` +
      `• Accueillez l’émotion plutôt que de « corriger » le souvenir.\n` +
      `• Orientez doucement (lieu, moment, visage familier).\n` +
      `• Utilisez photo, trombinoscope ou mémo audio si cela rassure.\n` +
      `• Gardez une routine prévisible pour les moments fragiles.\n` +
      `${profileHint(profileType)}`,
  },
  {
    keys: ['sommeil', 'nuit', 'fatigue', 'épuisé', 'épuisée', 'dormir'],
    reply: () =>
      `La fatigue de l’aidant est réelle ; voici des appuis concrets :\n` +
      `• Baissez les attentes pour ce soir ; une tâche à la fois.\n` +
      `• Si possible, organisez une relève courte.\n` +
      `• Gardez une routine de coucher simple et prévisible pour votre proche.\n` +
      `• Si l’épuisement dure, parlez-en à un professionnel de santé — sans que ce soit un suivi Aid'Ami.\n` +
      `Avez-vous une personne qui peut vous relever ne serait-ce qu’une heure ?`,
  },
  {
    keys: ['médicament', 'ordonnance', 'dose', 'posologie', 'pilule', 'dosage'],
    reply: () =>
      `Je ne donne ni diagnostic ni posologie.\n` +
      `• Pour un médicament : médecin ou pharmacien uniquement.\n` +
      `• Effet inquiétant ou urgence : 15 ou 112.\n` +
      `• Aid'Ami reste un soutien pratique pour l’aidant, pas un suivi clinique.`,
  },
  {
    keys: ['seul', 'seule', 'aidé', 'aide', 'soutien', 'culpab'],
    reply: () =>
      `Demander du soutien n’est pas un luxe :\n` +
      `• Prévoyez une pause courte aujourd’hui, même 10 minutes.\n` +
      `• Contactez un proche, une association d’aidants ou un professionnel.\n` +
      `• Notez une chose qui a un peu allégé la journée.\n` +
      `Vous méritez de l’aide autant que la personne que vous accompagnez. Souhaitez-vous des pistes de pause aidant ou de dialogue avec votre proche ?`,
  },
];

function defaultReply(profileType?: ProfileType | null): string {
  return (
    `Merci de partager ce que vous vivez. Quelques gestes simples :\n` +
    `• Respirez 4–6 secondes, une fois ou deux.\n` +
    `• Réduisez une stimulation (bruit, lumière, demandes).\n` +
    `• Reformulez une seule consigne claire, puis observez 2–3 minutes.\n` +
    `• ${profileHint(profileType)}\n` +
    `Ce n’est pas un avis médical. Danger immédiat : 15 ou 112. Détresse psy : 3114.`
  );
}

function lastUserText(request: AdviceReplyRequest): string {
  for (let i = request.messages.length - 1; i >= 0; i -= 1) {
    if (request.messages[i].role === 'user') {
      return request.messages[i].content.toLowerCase();
    }
  }
  return '';
}

export function createOfflineAdviceProvider(): AdviceProvider {
  return {
    name: 'offline',
    async reply(request: AdviceReplyRequest): Promise<AdviceReplyResult> {
      // Same rules as online: keep prompt construction for parity / future local models.
      void buildAdviceSystemPrompt(
        request.profileType,
        request.careRecipientFirstName,
      );

      const text = lastUserText(request);
      for (const heuristic of HEURISTICS) {
        if (heuristic.keys.some((key) => text.includes(key))) {
          return {
            content: heuristic.reply(request.profileType),
            provider: 'offline',
          };
        }
      }

      return {
        content: defaultReply(request.profileType),
        provider: 'offline',
      };
    },
  };
}
