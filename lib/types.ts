export interface Reward {
  id: string
  title: string
  description: string
  tierRequired: 1 | 2 | 3
  redemptionsLeft: number | null
  type: "digital" | "physical" | "rwa"
  imageUrl: string
}
