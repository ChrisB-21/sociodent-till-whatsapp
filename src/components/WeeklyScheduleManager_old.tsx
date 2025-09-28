import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  Home, 
  Building2, 
  Download, 
  RefreshCw, 
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Save
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, get, set } from 'firebase/database';
import { db } from '@/firebase';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { 
  generateWeeklySchedule, 
  formatScheduleForDisplay, 
  getDoctorSchedule, 
  getDaySchedule, 
  exportScheduleAsJSON,
  type ScheduleEntry 
} from '@/lib/doctorScheduleGenerator';

// Extended interface for manual editing
interface ManualScheduleEntry extends ScheduleEntry {
  id: string;
  doctorId: string;
  shift: 'Morning' | 'Afternoon' | 'Evening';
  location: 'Clinic' | 'Home Visit';
  startTime: string;
  endTime: string;
  slots: number;
}

interface WeeklyScheduleManagerProps {
  onScheduleGenerated?: (schedule: ScheduleEntry[]) => void;
}

const WeeklyScheduleManager: React.FC<WeeklyScheduleManagerProps> = ({ onScheduleGenerated }) => {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [manualSchedule, setManualSchedule] = useState<ManualScheduleEntry[]>([]);
  const [validation, setValidation] = useState<{ isValid: boolean; conflicts: string[] }>({ isValid: true, conflicts: [] });
  const [summary, setSummary] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Manual editing states
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization: string }[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [manualSelectedDay, setManualSelectedDay] = useState<string>('Monday');
  const { toast } = useToast();

  const doctors = ['dhanush', 'suriya', 'ram', 'siva'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const generateSchedule = async () => {
    setIsGenerating(true);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = generateWeeklySchedule();
    setSchedule(result.schedule);
    setValidation(result.validation);
    setSummary(result.summary);
    setIsGenerating(false);
    
    if (onScheduleGenerated) {
      onScheduleGenerated(result.schedule);
    }
  };

  const downloadSchedule = () => {
    const jsonData = exportScheduleAsJSON(schedule);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctor-weekly-schedule.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadFormattedSchedule = () => {
    const formattedData = formatScheduleForDisplay(schedule);
    const blob = new Blob([formattedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctor-weekly-schedule.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredSchedule = () => {
    let filtered = schedule;
    
    if (selectedDoctor !== 'all') {
      filtered = getDoctorSchedule(filtered, selectedDoctor);
    }
    
    if (selectedDay !== 'all') {
      filtered = getDaySchedule(filtered, selectedDay);
    }
    
    return filtered;
  };

  const getShiftTypeIcon = (type: string) => {
    return type === 'Clinic' ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />;
  };

  const getShiftTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'Clinic' ? 'default' : 'secondary'} className="ml-2">
        {getShiftTypeIcon(type)}
        <span className="ml-1">{type}</span>
      </Badge>
    );
  };

  // Generate initial schedule on component mount
  useEffect(() => {
    generateSchedule();
  }, []);

  // Manual editing functions
  const loadDoctors = async () => {
    try {
      const usersRef = dbRef(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        
        const doctorList = Object.entries(users)
          .filter(([_, user]: [string, any]) => {
            return user.role === 'doctor' && user.status === 'approved';
          })
          .map(([id, user]: [string, any]) => ({
            id,
            name: user.fullName || user.name || user.displayName || user.email || 'Unknown Doctor',
            specialization: user.specialization || 'General'
          }));
        
        setDoctors(doctorList);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };
  const loadScheduleFromDB = async () => {
    try {
      const weeklyRef = dbRef(db, 'weeklySchedule');
      const snapshot = await get(weeklyRef);
      
      if (snapshot.exists()) {
        const scheduleData = Object.values(snapshot.val()) as ManualScheduleEntry[];
        setManualSchedule(scheduleData);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  useEffect(() => {
    loadDoctors();
    loadScheduleFromDB();
  }, []);

  const getEntriesForDay = (day: string) => {
    return manualSchedule.filter(entry => entry.day === day);
  };

  const addNewEntry = () => {
    const newEntry: ManualScheduleEntry = {
      id: `manual-${Date.now()}`,
      doctorId: doctors.length > 0 ? doctors[0].id : '',
      day: manualSelectedDay,
      shift_time: '09:00 - 17:00',
      doctor: doctors.length > 0 ? doctors[0].name : '',
      type: 'Clinic',
      shift: 'Morning',
      location: 'Clinic',
      startTime: '09:00',
      endTime: '17:00',
      slots: 16
    };

    setManualSchedule([...manualSchedule, newEntry]);
    setEditingEntry(newEntry.id);
  };

  const updateEntry = (entryId: string, updates: Partial<ManualScheduleEntry>) => {
    setManualSchedule(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { 
              ...entry, 
              ...updates,
              doctor: updates.doctorId ? 
                doctors.find(d => d.id === updates.doctorId)?.name || entry.doctor 
                : entry.doctor
            }
          : entry
      )
    );
  };

  const deleteEntry = (entryId: string) => {
    setManualSchedule(prev => prev.filter(entry => entry.id !== entryId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const dayEntries = getEntriesForDay(manualSelectedDay);
    const reorderedEntries = Array.from(dayEntries);
    const [reorderedItem] = reorderedEntries.splice(result.source.index, 1);
    reorderedEntries.splice(result.destination.index, 0, reorderedItem);

    // Update the schedule with reordered entries
    const otherEntries = manualSchedule.filter(entry => entry.day !== manualSelectedDay);
    setManualSchedule([...otherEntries, ...reorderedEntries]);
  };

  const saveSchedule = async () => {
    setIsSaving(true);
    try {
      const weeklyRef = dbRef(db, 'weeklySchedule');
      const scheduleData = manualSchedule.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
      }, {} as Record<string, ManualScheduleEntry>);

      await set(weeklyRef, scheduleData);

      toast({
        title: 'Schedule Saved',
        description: 'Weekly schedule has been updated successfully',
      });

      // Convert manual schedule to regular schedule for callback
      const convertedSchedule: ScheduleEntry[] = manualSchedule.map(entry => ({
        day: entry.day,
        shift_time: entry.shift_time,
        doctor: entry.doctor,
        type: entry.type
      }));

      if (onScheduleGenerated) {
        onScheduleGenerated(convertedSchedule);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save schedule',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getShiftIcon = (location: string) => {
    return location === 'Clinic' ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />;
  };

  const getShiftBadge = (shift: string, location: string) => {
    const variant = shift === 'Morning' ? 'default' : shift === 'Afternoon' ? 'secondary' : 'outline';
    return (
      <Badge variant={variant} className="ml-2">
        {getShiftIcon(location)}
        <span className="ml-1">{shift} - {location}</span>
      </Badge>
    );
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule Manager
          </CardTitle>
          <CardDescription>
            Generate automatic schedules or manually create and edit doctor schedules with drag-and-drop functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auto" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto Generate</TabsTrigger>
              <TabsTrigger value="manual">Manual Editor</TabsTrigger>
            </TabsList>

            {/* Auto Generation Tab */}
            <TabsContent value="auto" className="space-y-6">
              <div className="flex gap-4 flex-wrap">
                <Button 
                  onClick={generateSchedule} 
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Generate Schedule'}
                </Button>
                
                {schedule.length > 0 && (
                  <>
                    <Button 
                      onClick={downloadSchedule} 
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON
                    </Button>
                    <Button 
                      onClick={downloadFormattedSchedule} 
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Text
                    </Button>
                  </>
                )}
              </div>

              {/* Validation Results */}
              {!validation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Schedule Conflicts Detected:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.conflicts.map((conflict, index) => (
                        <li key={index}>{conflict}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary */}
              {summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Schedule Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{summary.totalShifts}</div>
                        <div className="text-sm text-blue-800">Total Shifts</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{summary.clinicShifts}</div>
                        <div className="text-sm text-green-800">Clinic Shifts</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{summary.homeVisits}</div>
                        <div className="text-sm text-purple-800">Home Visits</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Shifts per Doctor:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {Object.entries(summary.shiftsPerDoctor).map(([doctor, count]) => (
                          <div key={doctor} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span className="capitalize">Dr. {doctor}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Auto Generated Schedule Display */}
              {schedule.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Weekly Schedule</CardTitle>
                    <CardDescription>
                      Filter by doctor or day to view specific schedules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="by-day">By Day</TabsTrigger>
                        <TabsTrigger value="by-doctor">By Doctor</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        <div className="space-y-4">
                          {days.map(day => {
                            const daySchedule = getDaySchedule(schedule, day);
                            const clinicShifts = daySchedule.filter(s => s.type === 'Clinic');
                            const homeVisits = daySchedule.filter(s => s.type === 'Home Visit');
                            
                            return (
                              <Card key={day}>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">{day}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Clinic Shifts
                                      </h4>
                                      <div className="space-y-2">
                                        {clinicShifts.map((shift, index) => (
                                          <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                            <span className="capitalize font-medium">Dr. {shift.doctor}</span>
                                            <span className="text-sm text-gray-600">{shift.shift_time}</span>
                                          </div>
                                        ))}
                                        {clinicShifts.length === 0 && (
                                          <div className="text-gray-500 text-sm">No clinic shifts scheduled</div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Home className="w-4 h-4" />
                                        Home Visits
                                      </h4>
                                      <div className="space-y-2">
                                        {homeVisits.map((shift, index) => (
                                          <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                                            <span className="capitalize font-medium">Dr. {shift.doctor}</span>
                                            <span className="text-sm text-gray-600">{shift.shift_time}</span>
                                          </div>
                                        ))}
                                        {homeVisits.length === 0 && (
                                          <div className="text-gray-500 text-sm">No home visits scheduled</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="by-day">
                        <div className="space-y-4">
                          <Select value={selectedDay} onValueChange={setSelectedDay}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Days</SelectItem>
                              {days.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedDay !== 'all' && (
                            <Card>
                              <CardHeader>
                                <CardTitle>{selectedDay} Schedule</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {getDaySchedule(schedule, selectedDay).map((shift, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-blue-100">
                                          <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <div className="font-medium capitalize">Dr. {shift.doctor}</div>
                                          <div className="text-sm text-gray-500">{shift.shift_time}</div>
                                        </div>
                                      </div>
                                      <Badge variant={shift.type === 'Clinic' ? 'default' : 'secondary'}>
                                        {shift.type === 'Clinic' ? <Building2 className="w-3 h-3 mr-1" /> : <Home className="w-3 h-3 mr-1" />}
                                        {shift.type}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="by-doctor">
                        <div className="space-y-4">
                          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Doctors</SelectItem>
                              {doctors.map(doctor => (
                                <SelectItem key={doctor.id} value={doctor.name}>{doctor.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedDoctor !== 'all' && (
                            <Card>
                              <CardHeader>
                                <CardTitle>Dr. {selectedDoctor}'s Schedule</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {getDoctorSchedule(schedule, selectedDoctor).map((shift, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-green-100">
                                          <Calendar className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                          <div className="font-medium">{shift.day}</div>
                                          <div className="text-sm text-gray-500">{shift.shift_time}</div>
                                        </div>
                                      </div>
                                      <Badge variant={shift.type === 'Clinic' ? 'default' : 'secondary'}>
                                        {shift.type === 'Clinic' ? <Building2 className="w-3 h-3 mr-1" /> : <Home className="w-3 h-3 mr-1" />}
                                        {shift.type}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Manual Editor Tab */}
            <TabsContent value="manual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Manual Schedule Editor
                  </CardTitle>
                  <CardDescription>
                    Drag and drop to rearrange doctor schedules, or edit individual entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Select value={manualSelectedDay} onValueChange={setManualSelectedDay}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addNewEntry} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={loadScheduleFromDB} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                      <Button onClick={saveSchedule} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Schedule'}
                      </Button>
                    </div>
                  </div>

                  {getEntriesForDay(manualSelectedDay).length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No schedule entries for {manualSelectedDay}. Click "Add Entry" to create one.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="schedule-entries">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {getEntriesForDay(manualSelectedDay).map((entry, index) => (
                              <Draggable key={entry.id} draggableId={entry.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-4 border rounded-lg bg-white ${
                                      snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-gray-400 hover:text-gray-600 cursor-grab"
                                      >
                                        <GripVertical className="w-5 h-5" />
                                      </div>

                                      {editingEntry === entry.id ? (
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                                          <Select 
                                            value={entry.doctorId} 
                                            onValueChange={(value) => updateEntry(entry.id, { doctorId: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select Doctor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {doctors.length === 0 ? (
                                                <SelectItem value="" disabled>
                                                  No doctors available
                                                </SelectItem>
                                              ) : (
                                                doctors.map(doctor => (
                                                  <SelectItem key={doctor.id} value={doctor.id}>
                                                    {doctor.name} ({doctor.specialization})
                                                  </SelectItem>
                                                ))
                                              )}
                                            </SelectContent>
                                          </Select>

                                          <Select 
                                            value={entry.shift} 
                                            onValueChange={(value) => updateEntry(entry.id, { shift: value as any })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Morning">Morning</SelectItem>
                                              <SelectItem value="Afternoon">Afternoon</SelectItem>
                                              <SelectItem value="Evening">Evening</SelectItem>
                                            </SelectContent>
                                          </Select>

                                          <Select 
                                            value={entry.location} 
                                            onValueChange={(value) => updateEntry(entry.id, { location: value as any, type: value as any })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Clinic">Clinic</SelectItem>
                                              <SelectItem value="Home Visit">Home Visit</SelectItem>
                                            </SelectContent>
                                          </Select>

                                          <Input
                                            type="time"
                                            value={entry.startTime}
                                            onChange={(e) => updateEntry(entry.id, { 
                                              startTime: e.target.value,
                                              shift_time: `${e.target.value} - ${entry.endTime}`
                                            })}
                                          />

                                          <Input
                                            type="time"
                                            value={entry.endTime}
                                            onChange={(e) => updateEntry(entry.id, { 
                                              endTime: e.target.value,
                                              shift_time: `${entry.startTime} - ${e.target.value}`
                                            })}
                                          />

                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              onClick={() => setEditingEntry(null)}
                                            >
                                              Save
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => deleteEntry(entry.id)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex-1 flex items-center justify-between">
                                          <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                              <User className="w-4 h-4 text-gray-600" />
                                              <span className="font-medium">{entry.doctor}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-4 h-4 text-gray-600" />
                                              <span className="text-sm text-gray-600">{entry.shift_time}</span>
                                            </div>
                                            {getShiftBadge(entry.shift, entry.location)}
                                          </div>
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => setEditingEntry(entry.id)}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
            <Button 
              onClick={generateSchedule} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate New Schedule'}
            </Button>
            
            {schedule.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={downloadSchedule}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={downloadFormattedSchedule}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Text
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Schedule Conflicts Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {validation.conflicts.map((conflict, index) => (
                <li key={index}>{conflict}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalShifts}</div>
                <div className="text-sm text-gray-500">Total Shifts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.clinicShifts}</div>
                <div className="text-sm text-gray-500">Clinic Shifts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.homeVisitSlots}</div>
                <div className="text-sm text-gray-500">Home Visits</div>
              </div>                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(Object.values(summary.shiftsPerDoctor)[0] as number) || 0}
                  </div>
                  <div className="text-sm text-gray-500">Shifts/Doctor</div>
                </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Shifts per Doctor:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(summary.shiftsPerDoctor).map(([doctor, count]) => (
                  <div key={doctor} className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="capitalize">Dr. {doctor}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Display */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Filter by doctor or day to view specific schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="by-day">By Day</TabsTrigger>
                <TabsTrigger value="by-doctor">By Doctor</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-4">
                  {days.map(day => {
                    const daySchedule = getDaySchedule(schedule, day);
                    const clinicShifts = daySchedule.filter(s => s.type === 'Clinic');
                    const homeVisits = daySchedule.filter(s => s.type === 'Home Visit');
                    
                    return (
                      <Card key={day}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{day}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Clinic Shifts
                              </h4>
                              <div className="space-y-2">
                                {clinicShifts.map((shift, index) => (
                                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                    <span className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      {shift.shift_time}
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      Dr. {shift.doctor}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Home Visits
                              </h4>
                              <div className="space-y-2">
                                {homeVisits.map((visit, index) => (
                                  <div key={index} className="flex items-center justify-between bg-purple-50 p-2 rounded">
                                    <span className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      {visit.shift_time}
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      Dr. {visit.doctor}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="by-day">
                <div className="mb-4">
                  <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    <option value="all">All Days</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  {getFilteredSchedule().map((entry, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{entry.day}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {entry.shift_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              Dr. {entry.doctor}
                            </span>
                          </div>
                          {getShiftTypeBadge(entry.type)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="by-doctor">
                <div className="mb-4">
                  <select 
                    value={selectedDoctor} 
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    <option value="all">All Doctors</option>
                    {doctors.map(doctor => (
                      <option key={doctor} value={doctor}>Dr. {doctor}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  {getFilteredSchedule().map((entry, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">Dr. {entry.doctor}</span>
                            <span className="text-gray-500">{entry.day}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {entry.shift_time}
                            </span>
                          </div>
                          {getShiftTypeBadge(entry.type)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklyScheduleManager;
