import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home as HomeIcon, MapPin, Video, ChevronRight, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConsultationBooking } from '@/hooks/useConsultationBooking';
import { ConsultationType } from '@/services/consultationService';

const Consultation = () => {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const initialType = searchParams.get('type') as ConsultationType || 'virtual';
	const rescheduleAppointmentId = searchParams.get('reschedule'); // Check if this is a reschedule

	const {
		// State
		step,
		consultationType,
		paymentMethod,
		isProcessingPayment,
		showReportWarning,
		hasIncompleteAppointments,
		incompleteAppointments,
		isCheckingAppointments,
		
		// Form data
		formData,
		
		// Methods
		setConsultationType,
		setPaymentMethod,
		setFormData,
		setShowReportWarning,
		
		// Actions
		handleContinue,
		handleBack,
		
		// Data
		consultationTypes,
		availableTimeSlots,
		availablePaymentMethods,
		selectedConsultation,
	} = useConsultationBooking({ 
		initialConsultationType: initialType,
		rescheduleAppointmentId: rescheduleAppointmentId 
	});

	// Date constraints for the date input
	const dateConstraints = {
		minDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
		maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days (2 months) from now
	};

	// Create consultation type icons mapping
	const getConsultationIcon = (type: ConsultationType) => {
		const iconMap = {
			virtual: <Video className="text-sociodent-600" size={24} />,
			home: <HomeIcon className="text-sociodent-600" size={24} />,
			clinic: <MapPin className="text-sociodent-600" size={24} />,
		};
		return iconMap[type];
	};

	// Create payment method icons mapping
	const getPaymentIcon = (methodId: string) => {
		const iconMap = {
			razorpay: <CreditCard className="h-5 w-5" />,
			cash: <Banknote className="h-5 w-5" />,
		};
		return iconMap[methodId as keyof typeof iconMap];
	};

	if (!selectedConsultation) {
		return <div>Loading...</div>;
	}

	return (
		<div className="min-h-screen flex flex-col">
			<main className="flex-grow pt-20">
				<section className="py-12 bg-gray-50">
					<div className="container-custom">
						<div className="max-w-3xl mx-auto">
							{/* Progress Indicator */}
							<div className="mb-10">
								<div className="flex items-center justify-between">
									{['Consultation Details', 'Payment', 'Confirmation'].map((label, index) => (
										<div key={label} className="flex items-center">
											<div className={`rounded-full h-10 w-10 flex items-center justify-center ${step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-sociodent-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
												{step > index + 1 ? '✓' : index + 1}
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium">{label}</p>
											</div>

											{index < 2 && (
												<div className="hidden sm:block w-24 border-t border-gray-200 mx-4"></div>
											)}
										</div>
									))}
								</div>
							</div>

							<div className="glass-card border border-white/50 rounded-2xl overflow-hidden shadow-md bg-white">
								{step === 1 && (
									<div className="p-6">
										<h1 className="text-2xl font-bold text-gray-900 mb-6">
											{rescheduleAppointmentId ? 'Reschedule Your Appointment' : 'Book Your Consultation'}
										</h1>

										{/* Reschedule Information */}
										{rescheduleAppointmentId && (
											<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
												<p className="text-blue-800">
													<span className="mr-2">🔄</span>
													You are rescheduling appointment #{rescheduleAppointmentId.slice(-8)}
												</p>
											</div>
										)}

										{/* Incomplete Appointments Warning */}
										{isCheckingAppointments && (
											<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
												<p className="text-blue-800">
													<span className="inline-block animate-spin mr-2">⏳</span>
													Checking for existing appointments...
												</p>
											</div>
										)}

										{hasIncompleteAppointments && incompleteAppointments.length > 0 && (
											<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
												<h3 className="text-red-800 font-semibold mb-2 flex items-center">
													<span className="mr-2">⚠️</span>
													Cannot Book New Appointment
												</h3>
												<p className="text-red-700 mb-3">
													You have {incompleteAppointments.length} incomplete appointment{incompleteAppointments.length > 1 ? 's' : ''} that must be completed or cancelled before booking a new one:
												</p>
												<div className="bg-white border border-red-200 rounded-md p-3 mb-3">
													<ul className="space-y-2">
														{incompleteAppointments.map((appointment, index) => (
															<li key={index} className="text-sm">
																<div className="flex items-center justify-between">
																	<div>
																		<span className="font-medium">{appointment.consultationType || 'Consultation'}</span>
																		<span className="text-gray-600 ml-2">
																			{appointment.date} at {appointment.time}
																		</span>
																	</div>
																	<span className={`px-2 py-1 text-xs rounded-full ${
																		appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
																		appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
																		'bg-gray-100 text-gray-800'
																	}`}>
																		{appointment.status || 'Pending'}
																	</span>
																</div>
																{appointment.doctorName && (
																	<div className="text-xs text-gray-500 mt-1">
																		Doctor: {appointment.doctorName}
																	</div>
																)}
															</li>
														))}
													</ul>
												</div>
												<div className="flex flex-col sm:flex-row gap-2">
													<Link 
														to="/my-profile" 
														className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center transition-colors"
													>
														View My Appointments
													</Link>
													<button
														onClick={() => window.location.reload()}
														className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
													>
														Refresh Status
													</button>
												</div>
												<p className="text-red-700 mt-3 text-sm">
													<strong>Note:</strong> This restriction ensures proper scheduling and prevents booking conflicts. Once your current appointment is completed or cancelled, you'll be able to book a new appointment.
												</p>
											</div>
										)}

										{/* Consultation Type */}
										<div className={`mb-6 ${hasIncompleteAppointments ? 'opacity-50 pointer-events-none' : ''}`}>
											<Label className="text-base font-medium mb-3 block">Select Consultation Type</Label>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
												{consultationTypes.map((type) => (
													<div
														key={type.type}
														className={`border rounded-xl p-4 cursor-pointer transition-all ${consultationType === type.type ? 'border-sociodent-600 bg-sociodent-50' : 'border-gray-200 hover:border-sociodent-300'}`}
														onClick={() => !hasIncompleteAppointments && setConsultationType(type.type)}
													>
														<div className="flex items-center mb-2">
															{getConsultationIcon(type.type)}
															<span className="ml-2 font-medium">{type.title}</span>
														</div>
														<p className="text-sm text-gray-600">{type.description}</p>
														<p className="mt-2 text-sociodent-600 font-semibold">₹{type.price.toFixed(2)}</p>
													</div>
												))}
											</div>
										</div>

										{/* Personal Information */}
										<div className={`mb-6 ${hasIncompleteAppointments ? 'opacity-50 pointer-events-none' : ''}`}>
											<h2 className="text-lg font-semibold mb-4">Personal Information</h2>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
												<div>
													<Label htmlFor="name">Full Name *</Label>
													<Input
														id="name"
														value={formData.name}
														onChange={(e) => setFormData({ name: e.target.value })}
														placeholder="John Doe"
														required
														disabled={hasIncompleteAppointments}
													/>
												</div>
												<div>
													<Label htmlFor="phone">Phone Number *</Label>
													<Input
														id="phone"
														value={formData.phone}
														onChange={(e) => setFormData({ phone: e.target.value })}
														placeholder="+91 12345 67890"
														required
														disabled={hasIncompleteAppointments}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
												<div>
													<Label htmlFor="date">Preferred Date *</Label>
													<Input
														id="date"
														type="date"
														value={formData.date}
														min={dateConstraints.minDate}
														max={dateConstraints.maxDate}
														onChange={(e) => setFormData({ date: e.target.value })}
														required
														disabled={hasIncompleteAppointments}
													/>
													<p className="text-sm text-gray-600 mt-1">
														📅 Appointments can be booked from 2 days ahead up to 2 months in advance
													</p>
												</div>
												<div>
													<Label htmlFor="time">Preferred Time *</Label>
													<select
														id="time"
														value={formData.time}
														onChange={(e) => setFormData({ time: e.target.value })}
														className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
														required
														disabled={hasIncompleteAppointments}
													>
														{availableTimeSlots.map((slot) => (
															<option key={slot} value={slot}>
																{slot}
															</option>
														))}
													</select>
												</div>
											</div>

											{consultationType !== 'virtual' && (
												<div className="mb-4">
													<Label htmlFor="address">Address *</Label>
													<Textarea
														id="address"
														value={formData.address || ''}
														onChange={(e) => setFormData({ address: e.target.value })}
														placeholder="Your full address"
														rows={3}
														required
														disabled={hasIncompleteAppointments}
													/>
												</div>
											)}
										</div>

										{/* Symptoms */}
										<div className={`mb-6 ${hasIncompleteAppointments ? 'opacity-50 pointer-events-none' : ''}`}>
											<h2 className="text-lg font-semibold mb-4">Dental Symptoms</h2>
											<div className="mb-4">
												<Label htmlFor="symptoms">Describe your symptoms *</Label>
												<Textarea
													id="symptoms"
													value={formData.symptoms}
													onChange={(e) => setFormData({ symptoms: e.target.value })}
													placeholder="Describe what dental issues you're experiencing"
													rows={4}
													required
													disabled={hasIncompleteAppointments}
												/>
											</div>

											<div className="mb-4">
												<div className="flex items-center mb-2">
													<input
														type="checkbox"
														id="hasReport"
														checked={formData.hasReport}
														onChange={(e) => setFormData({ hasReport: e.target.checked })}
														className="mr-2"
														disabled={hasIncompleteAppointments}
													/>
													<Label htmlFor="hasReport" className="cursor-pointer">
														Upload Dental Report or X-ray (optional)
													</Label>
												</div>

												{formData.hasReport && (
													<div className="mt-2">
														<Label htmlFor="reportFile">Upload your dental report or X-ray</Label>
														<Input
															id="reportFile"
															type="file"
															onChange={(e) => {
																if (e.target.files && e.target.files.length > 0) {
																	setFormData({ reportFile: e.target.files[0] });
																}
															}}
															accept=".pdf,.jpg,.jpeg,.png"
															disabled={hasIncompleteAppointments}
														/>
														<p className="text-xs text-gray-500 mt-1">
															Accepted formats: PDF, JPG, PNG (Max size: 5MB)
														</p>
													</div>
												)}
											</div>
										</div>

										<div className="border-t pt-6 mt-6">
											<div className="flex items-center justify-between mb-4">
												<span className="font-medium">Total:</span>
												<span className="text-xl font-bold text-sociodent-600">₹{selectedConsultation.price.toFixed(2)}</span>
											</div>
											<Button 
												className="w-full" 
												onClick={handleContinue}
												disabled={hasIncompleteAppointments || isCheckingAppointments}
											>
												{hasIncompleteAppointments 
													? 'Complete Existing Appointments First' 
													: isCheckingAppointments 
														? 'Checking Appointments...' 
														: 'Continue to Payment'
												} 
												{!hasIncompleteAppointments && !isCheckingAppointments && <ChevronRight className="ml-1 h-4 w-4" />}
											</Button>
										</div>
									</div>
								)}

								{step === 2 && (
									<div className="p-6">
										<h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h1>

										<div className="mb-6">
											<Label className="text-base font-medium mb-3 block">Select Payment Method</Label>
											<div className="grid grid-cols-1 gap-3">
												{availablePaymentMethods.map((method) => (
													<div
														key={method.id}
														className={`
                                border rounded-lg p-4 flex items-center cursor-pointer transition-all
                                ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}
                                ${paymentMethod === method.id && method.available ? 'border-sociodent-600 bg-sociodent-50' : 'border-gray-200 hover:border-sociodent-300'}
                              `}
														onClick={() => method.available && setPaymentMethod(method.id as 'razorpay' | 'cash')}
													>
														<div className="flex items-center">
															<div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === method.id && method.available ? 'border-sociodent-600' : 'border-gray-300'}`}>
																{paymentMethod === method.id && method.available && (
																	<div className="w-3 h-3 rounded-full bg-sociodent-600"></div>
																)}
															</div>
															{getPaymentIcon(method.id)}
															<span className="ml-2 font-medium">{method.name}</span>
														</div>
														{!method.available && (
															<span className="ml-auto text-sm text-gray-500">Not available for {consultationType} consultation</span>
														)}
													</div>
												))}
											</div>
										</div>

										{paymentMethod === 'cash' && (
											<div className="mb-6">
												<h2 className="text-lg font-semibold mb-4">Cash Payment</h2>
												<p className="text-gray-600">
													You will need to pay the amount in cash during the consultation.
													Our dentist will provide a receipt for your payment.
												</p>
											</div>
										)}

										<div className="border-t pt-6 mt-6">
											<div className="mb-4">
												<h3 className="font-medium mb-2">Booking Summary</h3>
												<div className="bg-gray-50 p-4 rounded-lg">
													<div className="flex justify-between mb-2">
														<span className="text-gray-600">Consultation Type:</span>
														<span className="font-medium">{selectedConsultation.title}</span>
													</div>
													<div className="flex justify-between mb-2">
														<span className="text-gray-600">Date & Time:</span>
														<span className="font-medium">{formData.date} at {formData.time}</span>
													</div>
													<div className="flex justify-between">
														<span className="text-gray-600">Total:</span>
														<span className="font-bold text-sociodent-600">₹{selectedConsultation.price.toFixed(2)}</span>
													</div>
												</div>
											</div>

											<div className="flex gap-3">
												<Button variant="outline" onClick={handleBack}>
													Back
												</Button>
												<Button className="flex-1" onClick={handleContinue} disabled={isProcessingPayment}>
													{isProcessingPayment ? 'Processing...' : 'Complete Payment'}
												</Button>
											</div>
										</div>
									</div>
								)}

								{step === 3 && (
									<div className="p-6 text-center">
										<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
											<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
											</svg>
										</div>

										<h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
										<p className="text-gray-600 mb-6">
											Your {consultationType} consultation has been successfully booked.
										</p>

										<div className="max-w-md mx-auto bg-gray-50 rounded-lg p-4 mb-6 text-left">
											<h3 className="font-medium mb-3">Appointment Details</h3>
											<div className="grid grid-cols-2 gap-y-2 text-sm">
												<div className="text-gray-600">Consultation:</div>
												<div className="font-medium">{selectedConsultation.title}</div>

												<div className="text-gray-600">Date:</div>
												<div className="font-medium">{formData.date}</div>

												<div className="text-gray-600">Time:</div>
												<div className="font-medium">{formData.time}</div>

												<div className="text-gray-600">Payment Method:</div>
												<div className="font-medium">
													{paymentMethod === 'razorpay' && 'Card/UPI/Netbanking'}
													{paymentMethod === 'cash' && 'Cash on Visit'}
												</div>

												<div className="text-gray-600">Amount Paid:</div>
												<div className="font-medium text-sociodent-600">₹{selectedConsultation.price.toFixed(2)}</div>
											</div>
										</div>

										<Button onClick={handleContinue}>
											Return to Home
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Report Warning Dialog */}
			{showReportWarning && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full">
						<h3 className="text-lg font-semibold mb-4">Missing Report</h3>
						<p className="text-gray-600 mb-6">
							You have indicated that you have a dental report or X-ray, but haven't uploaded any.
							Are you sure you want to continue without uploading?
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="outline" onClick={() => setShowReportWarning(false)}>
								Go Back
							</Button>
							<Button onClick={() => {
								setShowReportWarning(false);
								handleContinue();
							}}>
								Continue Anyway
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Consultation;