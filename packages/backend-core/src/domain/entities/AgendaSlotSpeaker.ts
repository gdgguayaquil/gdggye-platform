// Slot ↔ speaker join row. A slot may have 0 speakers (a break), 1
// (a regular talk), or many (a panel). Display order controls the rendered
// sequence within a single slot.

export interface AgendaSlotSpeaker {
  id: string;
  slotId: string;
  speakerId: string;
  displayOrder: number;
  createdAt: Date;
}
