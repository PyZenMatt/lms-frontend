export type DiscountSnapshot = {
  id: number;
  course_title?: string;
  status: "pending" | "closed";
  price_eur: string;
  discount_percent: string;
  student_pay_eur: string;
  teacher_eur: string;
  platform_eur: string;
  teacher_accepted_teo?: string | null;
  final_teacher_teo?: string | null;
  created_at?: string;
};

export type PendingListItem = { snapshot: DiscountSnapshot; decision_id: number };

export type PendingListResponse = { results: PendingListItem[] };

export type DecisionResponse = {
  decision_id: number;
  outcome: "accepted" | "declined" | "already_closed";
  snapshot_id: number;
  snapshot_status: "pending" | "closed";
  teacher_accepted_teo: string;
  final_teacher_teo: string;
  db_tx_id?: number | null;
  chain_tx_id?: number | null;
};
