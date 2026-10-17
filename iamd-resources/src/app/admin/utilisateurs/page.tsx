import { RoleForm } from "@/components/admin/role-form";
import { Alert, Badge } from "@/components/ui";
import { getUsers } from "@/lib/admin-queries";
import { requireAdminPage } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  const current = await requireAdminPage();
  const users = await getUsers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-950">Utilisateurs</h1>
        <p className="text-sm text-slate-500">Comptes inscrits et rôles. Le rôle est vérifié par la base de données à chaque opération.</p>
      </div>
      <Alert tone="info">
        La suppression définitive d&apos;un compte se fait depuis le tableau de bord Supabase (Authentication → Users). Le dernier administrateur
        ne peut pas être rétrogradé.
      </Alert>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Utilisateur</th>
              <th scope="col" className="px-4 py-2 font-medium">Inscription</th>
              <th scope="col" className="px-4 py-2 font-medium">Rôle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800">
                    {user.full_name ?? "—"} {user.id === current.id ? <Badge tone="brand">Vous</Badge> : null}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{formatDate(user.created_at)}</td>
                <td className="px-4 py-2.5">
                  <RoleForm userId={user.id} role={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
