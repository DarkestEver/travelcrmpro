import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Header from '../Header'

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 pb-24">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
