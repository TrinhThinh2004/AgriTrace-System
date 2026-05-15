import { AdminReviewClient } from "./AdminReviewClient";

export default async function AdminReviewPage(props: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await props.params;
  return <AdminReviewClient responseId={responseId} />;
}
