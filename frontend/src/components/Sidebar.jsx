import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTenantBranding } from '../contexts/TenantBrandingContext'
import { 
  FiHome, 
  FiUsers, 
  FiUserCheck, 
  FiTruck, 
  FiMap, 
  FiFileText, 
  FiCalendar,
  FiBarChart2,
  FiShield,
  FiSettings,
  FiMail,
  FiInbox,
  FiTrendingUp,
  FiChevronDown,
  FiChevronRight,
  FiCpu,
  FiClock
} from 'react-icons/fi'

const Sidebar = () => {
  const { user } = useAuthStore()
  const { logo, companyName, primaryColor, isLoading } = useTenantBranding()
  const [emailsOpen, setEmailsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: FiHome,
      roles: ['super_admin', 'operator'],
    },
    {
      name: 'Emails & Queries',
      icon: FiMail,
      roles: ['super_admin', 'operator'],
      submenu: [
        {
          name: 'Dashboard',
          path: '/emails',
          icon: FiInbox,
        },
        {
          name: 'Processing History',
          path: '/emails/history',
          icon: FiClock,
        },
        {
          name: 'Review Queue',
          path: '/emails/review-queue',
          icon: FiFileText,
        },
        {
          name: 'Analytics',
          path: '/emails/analytics',
          icon: FiTrendingUp,
        },
      ],
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
      name: 'Settings',
      icon: FiSettings,
      roles: ['super_admin', 'operator'],
      submenu: [
        {
          name: 'General',
          path: '/settings',
          icon: FiSettings,
        },
        {
          name: 'Email Accounts',
          path: '/settings/email-accounts',
          icon: FiMail,
        },
        {
          name: 'AI Configuration',
          path: '/settings/ai',
          icon: FiCpu,
        },
      ],
    },
    {
      name: 'Tenant Management',
      path: '/tenants',
      icon: FiSettings,
      roles: ['super_admin'],
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
      {/* Logo and Company Name */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          {logo ? (
            <img 
              src={logo} 
              alt={companyName} 
              className="h-10 w-10 object-contain"
            />
          ) : (
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: primaryColor }}
            >
              {companyName?.charAt(0) || 'T'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {!isLoading ? companyName : 'Loading...'}
            </h1>
            <p className="text-xs text-gray-500 uppercase">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        {filteredNavItems.map((item) => (
          <div key={item.name}>
            {item.submenu ? (
              // Menu item with submenu
              <div>
                <button
                  onClick={() => {
                    if (item.name === 'Emails & Queries') {
                      setEmailsOpen(!emailsOpen)
                    } else if (item.name === 'Settings') {
                      setSettingsOpen(!settingsOpen)
                    }
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg mb-2 transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="text-xl" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {(item.name === 'Emails & Queries' ? emailsOpen : settingsOpen) ? (
                    <FiChevronDown className="text-lg" />
                  ) : (
                    <FiChevronRight className="text-lg" />
                  )}
                </button>
                
                {((item.name === 'Emails & Queries' && emailsOpen) || (item.name === 'Settings' && settingsOpen)) && (
                  <div className="ml-4 space-y-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? primaryColor : 'transparent'
                        })}
                      >
                        <subItem.icon className="text-lg" />
                        <span className="text-sm font-medium">{subItem.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Regular menu item
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? primaryColor : 'transparent'
                })}
              >
                <item.icon className="text-xl" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
