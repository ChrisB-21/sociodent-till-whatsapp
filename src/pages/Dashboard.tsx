
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Calendar, 
//   Package, 
//   User, 
//   Settings, 
//   CreditCard, 
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   FileText
// } from 'lucide-react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useToast } from '@/hooks/use-toast';

// // Mock data for appointments
// const appointments = [
//   {
//     id: 'apt-1',
//     dentistName: 'Dr. Sarah Johnson',
//     dentistImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
//     date: '2023-09-15',
//     time: '10:30 AM',
//     type: 'virtual',
//     status: 'confirmed',
//     notes: 'Regular check-up and cleaning'
//   },
//   {
//     id: 'apt-2',
//     dentistName: 'Dr. Michael Chen',
//     dentistImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
//     date: '2023-10-03',
//     time: '2:00 PM',
//     type: 'clinic',
//     status: 'pending',
//     notes: 'Wisdom tooth evaluation'
//   }
// ];

// // Mock data for orders
// const orders = [
//   {
//     id: 'ord-1',
//     date: '2023-08-25',
//     status: 'delivered',
//     items: [
//       {
//         name: 'Sonic Pro Electric Toothbrush',
//         quantity: 1,
//         price: 79.99
//       },
//       {
//         name: 'Organic Mint Dental Floss',
//         quantity: 2,
//         price: 8.99
//       }
//     ],
//     total: 97.97,
//     deliveryAddress: '123 Main St, New York, NY 10001'
//   },
//   {
//     id: 'ord-2',
//     date: '2023-09-10',
//     status: 'processing',
//     items: [
//       {
//         name: 'Premium Teeth Whitening Kit',
//         quantity: 1,
//         price: 49.99
//       }
//     ],
//     total: 49.99,
//     deliveryAddress: '123 Main St, New York, NY 10001'
//   }
// ];

// // Mock user profile data
// const userProfile = {
//   name: 'Alex Johnson',
//   email: 'alex.johnson@example.com',
//   phone: '+1 (555) 123-4567',
//   address: '123 Main St, New York, NY 10001',
//   profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
// };

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [activeTab, setActiveTab] = useState('appointments');

//   // In a real application, we would check authentication here
//   // and redirect to login if not authenticated
//   React.useEffect(() => {
//     // Simulate checking auth
//     const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
//     if (!isAuthenticated) {
//       navigate('/auth?mode=login');
//       toast({
//         title: "Authentication Required",
//         description: "Please log in to access your dashboard",
//         variant: "destructive"
//       });
//     }
//   }, [navigate, toast]);

//   const getStatusStyle = (status: string) => {
//     switch (status) {
//       case 'confirmed':
//       case 'delivered':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//       case 'processing':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'confirmed':
//       case 'delivered':
//         return <CheckCircle className="w-4 h-4 mr-1" />;
//       case 'pending':
//       case 'processing':
//         return <Clock className="w-4 h-4 mr-1" />;
//       case 'cancelled':
//         return <AlertCircle className="w-4 h-4 mr-1" />;
//       default:
//         return null;
//     }
//   };

//   const handleCancelAppointment = (id: string) => {
//     toast({
//       title: "Appointment Cancelled",
//       description: "Your appointment has been cancelled successfully"
//     });
//     // In a real app, this would update the backend
//   };

//   const handleRescheduleAppointment = (id: string) => {
//     navigate(`/consultation?reschedule=${id}`);
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Navbar />

//       <main className="flex-grow pt-20">
//         <section className="py-8 bg-gray-50">
//           <div className="container-custom">
//             <div className="max-w-7xl mx-auto">
//               <div className="bg-white rounded-2xl shadow-md overflow-hidden">
//                 {/* Dashboard Header */}
//                 <div className="p-6 bg-sociodent-600 text-white">
//                   <div className="flex flex-col md:flex-row md:items-center justify-between">
//                     <div className="flex items-center mb-4 md:mb-0">
//                       <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
//                         <img 
//                           src={userProfile.profileImage} 
//                           alt={userProfile.name}
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                       <div className="ml-4">
//                         <h1 className="text-2xl font-bold">Welcome, {userProfile.name}</h1>
//                         <p className="text-sociodent-100">Manage your appointments and orders</p>
//                       </div>
//                     </div>
//                     <Button 
//                       onClick={() => {
//                         localStorage.removeItem('isAuthenticated');
//                         navigate('/');
//                         toast({
//                           title: "Logged Out",
//                           description: "You have been logged out successfully"
//                         });
//                       }}
//                       variant="outline"
//                       className="bg-white text-sociodent-600 hover:bg-sociodent-50"
//                     >
//                       Sign Out
//                     </Button>
//                   </div>
//                 </div>
                
//                 {/* Dashboard Tabs */}
//                 <Tabs 
//                   defaultValue="appointments" 
//                   value={activeTab}
//                   onValueChange={setActiveTab}
//                   className="w-full"
//                 >
//                   <div className="px-6 border-b">
//                     <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 h-14">
//                       <TabsTrigger value="appointments" className="text-sm">
//                         <Calendar className="w-4 h-4 mr-2" />
//                         <span className="hidden sm:inline">Appointments</span>
//                         <span className="sm:hidden">Appts</span>
//                       </TabsTrigger>
//                       <TabsTrigger value="orders" className="text-sm">
//                         <Package className="w-4 h-4 mr-2" />
//                         <span>Orders</span>
//                       </TabsTrigger>
//                       <TabsTrigger value="profile" className="text-sm">
//                         <User className="w-4 h-4 mr-2" />
//                         <span>Profile</span>
//                       </TabsTrigger>
//                       <TabsTrigger value="settings" className="text-sm hidden md:flex">
//                         <Settings className="w-4 h-4 mr-2" />
//                         <span>Settings</span>
//                       </TabsTrigger>
//                     </TabsList>
//                   </div>

//                   {/* Appointments Tab */}
//                   <TabsContent value="appointments" className="p-6">
//                     <h2 className="text-xl font-semibold mb-4">Your Dental Appointments</h2>
                    
//                     {appointments.length > 0 ? (
//                       <div className="space-y-6">
//                         {appointments.map(appointment => (
//                           <div 
//                             key={appointment.id}
//                             className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
//                           >
//                             <div className="flex flex-col md:flex-row md:items-center">
//                               <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
//                                 <div className="w-16 h-16 rounded-full overflow-hidden">
//                                   <img 
//                                     src={appointment.dentistImage}
//                                     alt={appointment.dentistName}
//                                     className="w-full h-full object-cover"
//                                   />
//                                 </div>
//                               </div>
                              
//                               <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 <div>
//                                   <h3 className="font-medium">{appointment.dentistName}</h3>
//                                   <div className="text-sm text-gray-500 capitalize">{appointment.type} Consultation</div>
//                                   <div className="text-sm text-gray-500">{appointment.notes}</div>
//                                 </div>
                                
//                                 <div>
//                                   <div className="flex items-center text-gray-700 mb-1">
//                                     <Calendar className="w-4 h-4 mr-2" />
//                                     <span>{appointment.date}</span>
//                                   </div>
//                                   <div className="flex items-center text-gray-700">
//                                     <Clock className="w-4 h-4 mr-2" />
//                                     <span>{appointment.time}</span>
//                                   </div>
//                                 </div>
                                
//                                 <div className="flex flex-col md:items-end justify-between">
//                                   <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
//                                     {getStatusIcon(appointment.status)}
//                                     <span className="capitalize">{appointment.status}</span>
//                                   </div>
                                  
//                                   <div className="flex gap-2 mt-3">
//                                     <Button 
//                                       variant="outline" 
//                                       size="sm"
//                                       onClick={() => handleRescheduleAppointment(appointment.id)}
//                                     >
//                                       Reschedule
//                                     </Button>
//                                     <Button 
//                                       variant="destructive" 
//                                       size="sm"
//                                       onClick={() => handleCancelAppointment(appointment.id)}
//                                     >
//                                       Cancel
//                                     </Button>
//                                   </div>
																	<div className="flex gap-2 mt-3">
																		<Button 
																			variant="outline" 
																			size="sm"
																			onClick={() => handleRescheduleAppointment(appointment.id)}
																		>
																			Reschedule
																		</Button>
																		<Button 
																			variant="destructive" 
																			size="sm"
																			onClick={() => handleCancelAppointment(appointment.id)}
																		>
																			Cancel
																		</Button>
																		<a
																			href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(userProfile.email)}`}
																			target="_blank"
																			rel="noopener noreferrer"
																		>
																			<Button variant="secondary" size="sm">
																				Email
																			</Button>
																		</a>
																	</div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
                        
//                         <div className="flex justify-center mt-4">
//                           <Button
//                             onClick={() => navigate('/consultation')}
//                             className="mt-2"
//                           >
//                             <Calendar className="mr-2 h-4 w-4" />
//                             Book New Appointment
//                           </Button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="text-center py-10">
//                         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                           <Calendar className="h-8 w-8 text-gray-400" />
//                         </div>
//                         <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments</h3>
//                         <p className="text-gray-500 mb-6">You don't have any scheduled appointments.</p>
//                         <Button
//                           onClick={() => navigate('/consultation')}
//                         >
//                           <Calendar className="mr-2 h-4 w-4" />
//                           Book an Appointment
//                         </Button>
//                       </div>
//                     )}
//                   </TabsContent>

//                   {/* Orders Tab */}
//                   <TabsContent value="orders" className="p-6">
//                     <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
                    
//                     {orders.length > 0 ? (
//                       <div className="space-y-6">
//                         {orders.map(order => (
//                           <div 
//                             key={order.id}
//                             className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
//                           >
//                             <div className="flex justify-between flex-wrap">
//                               <div>
//                                 <p className="font-medium">Order #{order.id}</p>
//                                 <p className="text-sm text-gray-500">Placed on {order.date}</p>
//                               </div>
//                               <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
//                                 {getStatusIcon(order.status)}
//                                 <span className="capitalize">{order.status}</span>
//                               </div>
//                             </div>
                            
//                             <div className="mt-4 border-t pt-4">
//                               <div className="space-y-3">
//                                 {order.items.map((item, index) => (
//                                   <div key={index} className="flex justify-between">
//                                     <div>
//                                       <p className="text-sm font-medium">{item.name}</p>
//                                       <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
//                                     </div>
//                                     <p className="text-sm">${item.price.toFixed(2)}</p>
//                                   </div>
//                                 ))}
//                               </div>
                              
//                               <div className="flex justify-between mt-4 pt-4 border-t">
//                                 <p className="font-medium">Total</p>
//                                 <p className="font-semibold">${order.total.toFixed(2)}</p>
//                               </div>
//                             </div>
                            
//                             <div className="mt-4 pt-4 border-t">
//                               <p className="text-sm text-gray-700 mb-4">
//                                 <span className="font-medium">Delivery Address:</span> {order.deliveryAddress}
//                               </p>
                              
//                               <div className="flex gap-2">
//                                 <Button variant="outline" size="sm">
//                                   <FileText className="mr-2 h-4 w-4" />
//                                   View Invoice
//                                 </Button>
//                                 <Button variant="outline" size="sm">
//                                   Track Order
//                                 </Button>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
                        
//                         <div className="flex justify-center mt-4">
//                           <Button
//                             onClick={() => navigate('/marketplace')}
//                             className="mt-2"
//                           >
//                             <Package className="mr-2 h-4 w-4" />
//                             Continue Shopping
//                           </Button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="text-center py-10">
//                         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                           <Package className="h-8 w-8 text-gray-400" />
//                         </div>
//                         <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
//                         <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
//                         <Button
//                           onClick={() => navigate('/marketplace')}
//                         >
//                           Start Shopping
//                         </Button>
//                       </div>
//                     )}
//                   </TabsContent>

//                   {/* Profile Tab */}
//                   <TabsContent value="profile" className="p-6">
//                     <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <div className="space-y-4">
//                           <div>
//                             <p className="text-sm font-medium text-gray-500">Full Name</p>
//                             <p className="text-base">{userProfile.name}</p>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium text-gray-500">Email Address</p>
//                             <p className="text-base">{userProfile.email}</p>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium text-gray-500">Phone Number</p>
//                             <p className="text-base">{userProfile.phone}</p>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium text-gray-500">Address</p>
//                             <p className="text-base">{userProfile.address}</p>
//                           </div>
//                         </div>
                        
//                         <div className="mt-6">
//                           <Button>
//                             Edit Profile
//                           </Button>
//                         </div>
//                       </div>
                      
//                       <div className="border rounded-lg p-6">
//                         <h3 className="font-medium mb-4">Payment Methods</h3>
                        
//                         <div className="space-y-4">
//                           <div className="flex items-center p-3 border rounded-md">
//                             <CreditCard className="h-8 w-8 text-gray-400 mr-3" />
//                             <div>
//                               <p className="font-medium">Visa ending in 4242</p>
//                               <p className="text-sm text-gray-500">Expires 12/25</p>
//                             </div>
//                           </div>
                          
//                           <Button variant="outline" className="w-full">
//                             Add Payment Method
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   </TabsContent>

//                   {/* Settings Tab */}
//                   <TabsContent value="settings" className="p-6">
//                     <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                    
//                     <div className="space-y-6">
//                       <div className="border rounded-lg p-4">
//                         <h3 className="font-medium mb-2">Notifications</h3>
//                         <div className="space-y-3">
//                           <div className="flex items-center justify-between">
//                             <div>
//                               <p className="font-medium">Email Notifications</p>
//                               <p className="text-sm text-gray-500">Receive emails about appointments and orders</p>
//                             </div>
//                             <div className="form-control">
//                               <input type="checkbox" className="toggle toggle-primary" defaultChecked />
//                             </div>
//                           </div>
                          
//                           <div className="flex items-center justify-between">
//                             <div>
//                               <p className="font-medium">SMS Notifications</p>
//                               <p className="text-sm text-gray-500">Get text messages for appointment reminders</p>
//                             </div>
//                             <div className="form-control">
//                               <input type="checkbox" className="toggle toggle-primary" defaultChecked />
//                             </div>
//                           </div>
                          
//                           <div className="flex items-center justify-between">
//                             <div>
//                               <p className="font-medium">Marketing Communications</p>
//                               <p className="text-sm text-gray-500">Receive updates on promotions and new services</p>
//                             </div>
//                             <div className="form-control">
//                               <input type="checkbox" className="toggle toggle-primary" />
//                             </div>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="border rounded-lg p-4">
//                         <h3 className="font-medium mb-2">Security</h3>
//                         <div className="space-y-3">
//                           <Button variant="outline" className="w-full sm:w-auto">
//                             Change Password
//                           </Button>
//                           <Button variant="outline" className="w-full sm:w-auto">
//                             Two-Factor Authentication
//                           </Button>
//                         </div>
//                       </div>
                      
//                       <div className="border border-red-200 rounded-lg p-4 bg-red-50">
//                         <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
//                         <p className="text-sm text-gray-600 mb-3">Once you delete your account, there is no going back. Please be certain.</p>
//                         <Button variant="destructive" size="sm">
//                           Delete Account
//                         </Button>
//                       </div>
//                     </div>
//                   </TabsContent>
//                 </Tabs>
//               </div>
//             </div>
//           </div>
//         </section>
//       </main>
      
//       <Footer />
//     </div>
//   );
// };

// export default Dashboard;
