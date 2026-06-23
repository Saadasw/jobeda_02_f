import { AppShell, Burger, Button, Group, Menu, NavLink, ScrollArea, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

const NAV_ITEMS: { label: string; to: string; roles?: string[] }[] = [
  { label: 'Dashboard', to: '/dashboard', roles: ['owner', 'admin'] },
  { label: 'Students', to: '/students' },
  { label: 'Fee types', to: '/fees/types', roles: ['owner', 'admin', 'accountant'] },
  { label: 'Fee structures', to: '/fees/structures', roles: ['owner', 'admin', 'accountant'] },
  { label: 'Fee groups', to: '/fees/groups', roles: ['owner', 'admin', 'accountant'] },
  { label: 'Accounts', to: '/accounts', roles: ['owner', 'admin', 'accountant'] },
  { label: 'Expenses', to: '/expenses', roles: ['owner', 'admin', 'accountant'] },
  { label: 'Income', to: '/income', roles: ['owner', 'admin', 'accountant'] },
];

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>Jobeda Madrasa ERP</Title>
          </Group>
          <Menu position="bottom-end" withinPortal shadow="md">
            <Menu.Target>
              <Button variant="subtle" size="sm">
                {user?.full_name ?? 'Account'}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Text size="xs">{user?.email}</Text>
                <Text size="xs" c="dimmed">
                  Role: {user?.role_name ?? '—'}
                </Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item onClick={handleLogout}>Sign out</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <ScrollArea>
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role_name ?? '')).map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              active={pathname.startsWith(item.to)}
            />
          ))}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
