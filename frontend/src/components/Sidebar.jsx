import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 
  FiHome, 
  FiUsers, 
  FiUserCheck, 
  FiTruck, 
  FiMap, 
  FiFileText, 
  FiCalendar,
  FiBarChart2,
  FiShield
} from 'react-icons/fi'

const Sidebar = () => {
  const { user } = useAuthStore()

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: FiHome,
      roles: ['super_admin', 'operator', 'agent', 'supplier'],
    },
    {
      name: 'Agents',
      path: '/agents',
      icon: FiUserCheck,
      roles: ['super_admin', 'operator'],
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: FiUsers,
      roles: ['super_admin', 'operator', 'agent'],
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      icon: FiTruck,
      roles: ['super_admin', 'operator', 'agent'],
    },
    {
      name: 'Itineraries',
      path: '/itineraries',
      icon: FiMap,
      roles: ['super_admin', 'operator', 'agent'],
    },
    {
      name: 'Quotes',
      path: '/quotes',
      icon: FiFileText,
      roles: ['super_admin', 'operator', 'agent'],
    },
    {
      name: 'Bookings',
      path: '/bookings',
      icon: FiCalendar,
      roles: ['super_admin', 'operator', 'agent'],
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: FiBarChart2,
      roles: ['super_admin', 'operator'],
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      icon: FiShield,
      roles: ['super_admin'],
    },
  ]

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  )

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary-600">Travel CRM</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role?.replace('_', ' ').toUpperCase()}
        </p>
      </div>

      <nav className="p-4">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="text-xl" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
