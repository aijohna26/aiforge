import { map } from 'nanostores';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
  handedOver: false,
  activeTicketId: null as string | null,
});
