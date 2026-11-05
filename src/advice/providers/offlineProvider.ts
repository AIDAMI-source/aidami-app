import type { ProfileType } from '../../types/models';
import { buildAdviceSystemPrompt } from '../systemPrompt';
import type {
  AdviceProvider,
  AdviceReplyRequest,
  AdviceReplyResult,
} from '../types';

type Heuristic = {
  keys: string[];
  reply: (profileType?: ProfileType | null) => string;
};

function profileHint(profileType?: ProfileType | null): string {
  if (profileType === 'ALZHEIMER') {
    return 'Avec un profil Alzheimer, privilégiez la validation (« je vois que c’est difficile ») plutôt que la contradiction.';
  }
  if (profileType === 'TSA_TDAH') {
    return 'Avec un profil TSA/TDAH, réduisez les stimulations (bruit, lumière) et proposez une seule consigne à la fois.';
  }
  if (profileType === 'MIXED') {
    return 'Profil mixte : observez si la détresse vient plutôt de la confusion (mémoire) ou de la surcharge sensorielle.';
  }
  return 'Adaptez selon ce que vous observez chez votre proche.';
}

const HEURISTICS: Heuristic[] = [
  {
    keys: [
      'urgence',
      'danger',
      'violence',
      'suicide',
      '112',
      '15',
      'se fait mal',
      'agression',
    ],
    reply: () =>
      `Votre sécurité et celle de votre proche passent avant tout. Si la situation est dangereuse maintenant, appelez le 15 (SAMU) ou le 112, puis mettez-vous à l’abri. Ces conseils Aid'Ami ne remplacent pas les secours.`,
  },
  {
    keys: ['crise', 'meltdown', 'surcharge', 'panique', 'agité', 'agitée', 'cri'],
    reply: (profileType) =>
      `Respirez un instant — vous n’êtes pas seul·e. Réduisez le bruit et les demandes, restez à une distance rassurante, et proposez un outil simple (casque, objet familier, pièce calme). ${profileHint(profileType)} Quand la vague retombe, notez ce qui a aidé pour la prochaine fois.`,
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
      `La confusion est éprouvante pour l’aidant aussi. Évitez de « corriger » : accueillez l’émotion, orientez doucement (lieu, moment, visage familier), et utilisez des photos ou un mémo audio si cela rassure. ${profileHint(profileType)}`,
  },
  {
    keys: ['sommeil', 'nuit', 'fatigue', 'épuisé', 'épuisée', 'dormir'],
    reply: () =>
      `La fatigue de l’aidant est réelle. Si possible, organisez une relève courte, baissez les attentes pour ce soir, et gardez une routine de coucher prévisible pour votre proche. Si l’épuisement dure, parlez-en à un professionnel de santé — ce n’est pas un échec.`,
  },
  {
    keys: ['médicament', 'ordonnance', 'dose', 'pilule'],
    reply: () =>
      `Je ne peux pas conseiller de traitement. Pour toute question sur un médicament, contactez le médecin ou le pharmacien. En cas d’effet inquiétant ou d’urgence, appelez le 15.`,
  },
  {
    keys: ['seul', 'seule', 'aidé', 'aide', 'soutien', 'culpab'],
    reply: () =>
      `Demander du soutien n’est pas un luxe. Une courte pause, un proche, une association d’aidants ou un professionnel peut changer la journée. Vous méritez de l’aide autant que la personne que vous accompagnez.`,
  },
];

function defaultReply(profileType?: ProfileType | null): string {
  return `Merci de partager ce que vous vivez. Essayez une étape concrète : respirer 4-6, réduire une stimulation, reformuler une consigne simple, puis observer 2–3 minutes. ${profileHint(profileType)} Ce n’est pas un avis médical ; en danger immédiat, appelez le 15 ou le 112.`;
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
      // Keep system prompt construction for future local models / logging.
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
