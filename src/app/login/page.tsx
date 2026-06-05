import { redirect } from "next/navigation";
import { Layout } from "antd";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

const { Content } = Layout;

export default async function LoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) redirect("/activities");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <LoginForm />
      </Content>
    </Layout>
  );
}
