type RoleWithPermissions = {
  name: string;
  permissions: Record<string, boolean> | null;
} | null;

// roles.permissions é escrita no signup (jobs.create, jobs.delete,
// candidates.view, billing.manage, team.manage) mas até agora nunca era lida
// — todas as verificações de autorização eram uma comparação de string ao
// nome do role ("Admin"). Isso torna o modelo de permissões decorativo e faz
// depender a autorização de um campo de texto livre, mutável.
export function hasPermission(
  appUser: { roles: RoleWithPermissions | RoleWithPermissions[] },
  permission: string
): boolean {
  const role = Array.isArray(appUser.roles) ? appUser.roles[0] : appUser.roles;
  return role?.permissions?.[permission] === true;
}
