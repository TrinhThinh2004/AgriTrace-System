import { CertificationFlowClient } from "./CertificationFlowClient";

export default async function FarmCertificationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <CertificationFlowClient farmId={id} />;
}
