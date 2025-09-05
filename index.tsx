import React, { useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

type Message = {
    id: number;
    content: string;
    date: string;
    status: 'Sent' | 'Received';
};

type Member = {
  id: number;
  name: string;
  photoUrl?: string;
  memberType: 'New Convert' | 'Member' | 'Leader';
  gender: 'Male' | 'Female';
  status: 'Active' | 'Inactive' | 'Pending' | 'Backsliding';
  phone: string;
  email: string;
  joinDate: string;
  dateOfBirth: string;
  groups: string[];
  centre: 'Makhaza' | 'Other';
  messages: Message[];
  address?: string;
  notes?: string;
};

const CHURCH_GROUPS = [
    'Choir', 'Dancing stars', 'Media Team', 'Ushers', 'Airport Stars',
    'Bacenta Leader', 'Basonta Leader', 'Praise and Worship Team',
    'New member', 'First Timer(Visitor Only)', 'First Timer(new convert)', 'Kids Church'
];


const mockMembers: Member[] = [
    { id: 1, name: 'John Doe', photoUrl: 'https://i.imgur.com/8aRPATH.png', memberType: 'Member', gender: 'Male', status: 'Active', phone: '+27824567890', email: 'john.doe@example.com', joinDate: '2023-08-15', dateOfBirth: '1990-05-15', groups: ['Ushers', 'Media Team'], centre: 'Makhaza', messages: [{id: 1, content: "Welcome! Event reminder for Sunday.", date: "2024-07-20", status: 'Received'}], address: '123 Main St, Makhaza, Cape Town', notes: 'Has shown great potential in the media team.' },
    { id: 2, name: 'Jane Smith', photoUrl: 'https://i.imgur.com/O318uGz.png', memberType: 'Leader', gender: 'Female', status: 'Active', phone: '+27731234567', email: 'jane.smith@example.com', joinDate: '2022-03-20', dateOfBirth: '1988-11-22', groups: ['Bacenta Leader', 'Praise and Worship Team'], centre: 'Makhaza', messages: [], address: '456 Oak Ave, Makhaza, Cape Town' },
    { id: 3, name: 'Peter Jones', photoUrl: 'https://i.imgur.com/sCNoiOV.png', memberType: 'New Convert', gender: 'Male', status: 'Pending', phone: '+27619876543', email: 'peter.jones@example.com', joinDate: '2024-07-10', dateOfBirth: '2002-01-30', groups: ['First Timer(new convert)'], centre: 'Makhaza', messages: [{id: 1, content: "First timer follow-up message.", date: "2024-07-11", status: 'Sent'}], address: '789 Pine Rd, Site B, Khayelitsha' },
    { id: 4, name: 'Mary Williams', photoUrl: 'https://i.imgur.com/QCNb7s1.png', memberType: 'Member', gender: 'Female', status: 'Backsliding', phone: '+27845556677', email: 'mary.w@example.com', joinDate: '2023-01-05', dateOfBirth: '1995-09-05', groups: ['Choir'], centre: 'Makhaza', messages: [], address: '101 Church St, Makhaza, Cape Town', notes: "Has not attended service for the last 3 weeks." },
    { id: 5, name: 'David Brown', photoUrl: 'https://i.imgur.com/DHH86P0.png', memberType: 'Member', gender: 'Male', status: 'Active', phone: '+27723344556', email: 'david.b@example.com', joinDate: '2024-06-25', dateOfBirth: '1998-03-12', groups: ['Media Team'], centre: 'Other', messages: [], address: '222 Side St, Harare, Khayelitsha' },
    { id: 6, name: 'Samuel Green', photoUrl: 'https://i.imgur.com/K0DbkLg.png', memberType: 'Leader', gender: 'Male', status: 'Active', phone: '+27812345678', email: 'sam.g@example.com', joinDate: '2021-11-10', dateOfBirth: '1985-07-19', groups: ['Bacenta Leader'], centre: 'Makhaza', messages: [], address: '333 Gospel Ln, Makhaza, Cape Town' },
    { id: 7, name: 'Tim Doe', photoUrl: 'https://i.imgur.com/K0DbkLg.png', memberType: 'Member', gender: 'Male', status: 'Active', phone: '+27824567891', email: 'tim.doe@example.com', joinDate: '2024-01-15', dateOfBirth: '2015-05-20', groups: ['Kids Church'], centre: 'Makhaza', messages: [], address: '123 Main St, Makhaza, Cape Town' },
    { id: 8, name: 'Sue Smith', photoUrl: 'https://i.imgur.com/QCNb7s1.png', memberType: 'Member', gender: 'Female', status: 'Active', phone: '+27731234568', email: 'sue.smith@example.com', joinDate: '2024-02-20', dateOfBirth: '2017-11-30', groups: ['Kids Church'], centre: 'Makhaza', messages: [], address: '456 Oak Ave, Makhaza, Cape Town' },
];

type ServiceAttendanceRecord = {
    serviceName: string;
    preacher: string;
    messageTitle: string;
    presentMemberIds: number[];
    firstTimersCount: number;
    newConvertsCount: number;
};

type Service = {
    name: string;
    time: string;
};

type ChurchEvent = {
    id: number;
    name: string;
    date: string;
    time: string;
    location: string;
    organizer: string;
    targetGroup: string;
    description: string;
    rsvps: number[]; // Array of member IDs who have RSVP'd
    reminderEnabled: boolean;
    reminderTime: '1 day before' | '2 hours before' | '1 hour before';
    messageTemplate: 'youth' | 'standard' | 'meeting';
};

const messageTemplates: Record<ChurchEvent['messageTemplate'], (event: ChurchEvent) => string> = {
    youth: (event) => `📅 Event: ${event.name}\n🕘 ${new Date(event.date).toDateString()}, ${event.time}\n📍 ${event.location}\n👉 Reply YES to attend. Special youth service!`,
    standard: (event) => `Hello! A reminder for our upcoming event:\n\nEvent: ${event.name}\nDate: ${new Date(event.date).toDateString()} at ${event.time}\nLocation: ${event.location}\n\nWe look forward to seeing you there!`,
    meeting: (event) => `Reminder: Important Meeting\n\nTopic: ${event.name}\nDate: ${new Date(event.date).toDateString()}\nTime: ${event.time}\nLocation: ${event.location}\n\nPlease be prompt.`,
};

type BacentaMeeting = {
    id: number;
    date: string;
    messageTitle: string;
    preacher: string;
    scripture: string;
    attendance: number;
    offering: number;
    notes: string;
};

type Bacenta = {
    id: number;
    name: string;
    leaderId: number;
    memberIds: number[];
    meetingDay: string;
    meetingTime: string;
    location: string;
    meetings: BacentaMeeting[];
};

type CurriculumWeek = {
    week: number;
    title: string;
    scripture: string;
};

type StudentProgress = {
    studentId: number;
    attendance: boolean[];
    notes: string[];
    evidence: (string | null)[];
    teacherId: number;
    status: 'In Progress' | 'Completed' | 'Dropped Out';
};

const strongChristianAcademyCurriculum: CurriculumWeek[] = [
    { week: 1, title: 'HOLY GHOST BAPTISM', scripture: 'Mark 16:15-17, Acts 8:35-38, Acts 10:44-48, Acts 19:1-6' },
    { week: 2, title: 'Seven Steps To Salvation', scripture: 'Book: Born Again (Chapter 4 & 5)' },
    { week: 3, title: 'What You Must Do / Fellowship / Witnessing', scripture: 'Key principles for a new believer.' },
    { week: 4, title: 'Water Baptism & Holy Ghost Baptism', scripture: 'Understanding foundational experiences.' },
    { week: 5, title: 'Why Every Believer Must Speak in Tongues', scripture: 'Exploring the gift of tongues.' },
    { week: 6, title: 'What You Must Know About Prayer', scripture: 'Developing a consistent prayer life.' },
    { week: 7, title: 'Your Role as a Church Member / The Bible', scripture: 'Integration into the church body and the Word.' },
    { week: 8, title: 'Review and Prayer', scripture: 'Consolidating learnings and spiritual focus.' },
    { week: 9, title: 'Review and Prayer', scripture: 'Final preparations and deeper understanding.' },
    { week: 10, title: 'Exams & Graduation', scripture: 'Quarterly Graduation: 2nd Sunday' },
];

const mockStudentProgress: StudentProgress[] = [
    { studentId: 3, teacherId: 2, status: 'In Progress', attendance: [true, true, true, false, false, false, false, false, false, false], notes: ['', 'Good participation.', '', '', '', '', '', '', '', ''], evidence: [null, 'https://i.imgur.com/3Z3e3bC.jpeg', null, null, null, null, null, null, null, null] },
    { studentId: 5, teacherId: 2, status: 'In Progress', attendance: [true, false, false, false, false, false, false, false, false, false], notes: [''], evidence: [null, null, null, null, null, null, null, null, null, null] }
];

type VisitReport = {
    visitDate: string;
    visitedBy: string;
    metWith: string;
    notes: string;
    followUpActions: string;
    evidencePhoto: string | null;
};

type Visitation = {
    id: number;
    memberId: number;
    creationDate: string;
    reason: 'First Timer Follow-up' | 'Missed Service' | 'Leader Report' | 'General Check-in' | 'Encouragement';
    notes: string | null;
    priority: 'High' | 'Medium' | 'Low';
    assignedLeaderId: number;
    status: 'Pending' | 'In Progress' | 'Completed';
    report: VisitReport | null;
};

const mockVisitations: Visitation[] = [
    { id: 1, memberId: 3, creationDate: '2024-07-18', reason: 'First Timer Follow-up', notes: null, priority: 'High', assignedLeaderId: 2, status: 'Pending', report: null },
    { id: 2, memberId: 4, creationDate: '2024-07-15', reason: 'Missed Service', notes: "Missed two consecutive Sunday services.", priority: 'Medium', assignedLeaderId: 2, status: 'In Progress', report: null },
    { id: 3, memberId: 1, creationDate: '2024-07-10', reason: 'Leader Report', notes: "Jane Smith reported that John is facing some family challenges and needs encouragement.", priority: 'High', assignedLeaderId: 2, status: 'Completed', report: {
        visitDate: "2024-07-12",
        visitedBy: "Jane Smith",
        metWith: "John and his wife",
        notes: "Had a good conversation and prayed with them. They are feeling more hopeful. They need some practical support with meals for a few days.",
        followUpActions: "Connect to welfare team for meal support. Follow up call in 3 days.",
        evidencePhoto: "https://i.imgur.com/gxsUj6d.png" // Placeholder
    }},
    { id: 4, memberId: 5, creationDate: '2024-07-22', reason: 'General Check-in', notes: 'Follow up on his new role.', priority: 'Low', assignedLeaderId: 6, status: 'Completed', report: { visitDate: "2024-07-23", visitedBy: "Samuel Green", metWith: "David Brown", notes: "He is settling in well.", followUpActions: "None", evidencePhoto: null }},
];

type WeeklyLeaderStats = {
  leaderId: number;
  year: number;
  week: number;
  prayerHours: number;
  quietTimeStreak: number;
  readingProgress: {
    book: string;
    chaptersRead: number;
    totalChapters: number;
  };
};

const getCurrentWeek = () => {
    const now = new Date();
    // January 1st of the current year
    const start = new Date(now.getFullYear(), 0, 1);
    // Day number of the year
    const day = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    // Calculate week number
    const week = Math.ceil((day + start.getDay() + 1) / 7);
    return { year: now.getFullYear(), week };
};

const mockWeeklyLeaderStats: WeeklyLeaderStats[] = [
    // Previous Week
    { leaderId: 2, year: 2024, week: 29, prayerHours: 40, quietTimeStreak: 12, readingProgress: { book: "John", chaptersRead: 15, totalChapters: 21 }},
    { leaderId: 6, year: 2024, week: 29, prayerHours: 32, quietTimeStreak: 5, readingProgress: { book: "Acts", chaptersRead: 8, totalChapters: 28 }},
    // Current Week
    { leaderId: 2, year: 2024, week: 30, prayerHours: 42, quietTimeStreak: 15, readingProgress: { book: "John", chaptersRead: 18, totalChapters: 21 }},
    { leaderId: 6, year: 2024, week: 30, prayerHours: 35, quietTimeStreak: 8, readingProgress: { book: "Acts", chaptersRead: 10, totalChapters: 28 }},
];

const BIBLE_BOOKS: Record<string, number> = {
  // Old Testament
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10,
  "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
  "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52,
  "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3,
  "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
  "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
  // New Testament
  "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
  "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
  "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
  "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
  "Jude": 1, "Revelation": 22
};

// FIX: Define initial events data with explicit typing to satisfy ChurchEvent type constraints.
const initialEvents: ChurchEvent[] = [
    { id: 1, name: 'Sunday Youth Service', date: '2024-09-15', time: '10:00 AM', location: 'Main Hall', organizer: 'Pastor John', targetGroup: 'Youth', description: 'Special fasting prayer, theme: "Revival in the City"', rsvps: [1, 3], reminderEnabled: true, reminderTime: '1 day before', messageTemplate: 'youth' },
    { id: 2, name: 'Choir Practice', date: '2024-09-12', time: '06:00 PM', location: 'Room 2B', organizer: 'Jane Smith', targetGroup: 'Choir Only', description: 'Practice for Sunday service.', rsvps: [4], reminderEnabled: false, reminderTime: '1 day before', messageTemplate: 'standard' },
];

const calculateAge = (dobString: string): number => {
    if (!dobString) return 99; // Default to adult if no DOB is provided
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};


const App = () => {
  const [activeTab, setActiveTab] = useState('directory');
  
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [allAttendance, setAllAttendance] = useState<Record<string, ServiceAttendanceRecord>>({
      '2024-07-28': { serviceName: 'Sunday Morning Service', preacher: 'Jane Smith', messageTitle: 'The Power of Forgiveness', presentMemberIds: [1, 2, 3, 5, 6, 7, 8], firstTimersCount: 2, newConvertsCount: 1 },
      '2024-07-24': { serviceName: 'Midweek Bible Study', preacher: 'Samuel Green', messageTitle: 'Walking in Faith', presentMemberIds: [2, 6], firstTimersCount: 0, newConvertsCount: 0 },
      '2024-07-21': { serviceName: 'Sunday Morning Service', preacher: 'Jane Smith', messageTitle: "God's Abundant Grace", presentMemberIds: [1, 2, 4, 5, 6, 7], firstTimersCount: 0, newConvertsCount: 0 },
  });

   const [churchSettings, setChurchSettings] = useState({
    name: 'Grace Fellowship Chapel',
    logo: 'https://i.imgur.com/gxsUj6d.png',
  });
  const [services, setServices] = useState<Service[]>([
      { name: 'Sunday Morning Service', time: '10:00 AM' },
      { name: 'Midweek Bible Study', time: '07:00 PM' },
  ]);
  
  const [events, setEvents] = useState<ChurchEvent[]>(
    initialEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );
  
  const [bacentas, setBacentas] = useState<Bacenta[]>([
      { id: 1, name: "Makhaza Central Bacenta", leaderId: 2, memberIds: [1, 3, 4], meetingDay: "Wednesday", meetingTime: "6:00 PM", location: "123 Main St, Makhaza", meetings: [
          {id: 1, date: "2024-07-17", messageTitle: "The Good Shepherd", preacher: "Jane Smith", scripture: "Psalm 23", attendance: 3, offering: 150, notes: "Good turnout. Peter shared a testimony."}
      ]},
      { id: 2, name: "Harare Square Bacenta", leaderId: 6, memberIds: [5], meetingDay: "Tuesday", meetingTime: "7:00 PM", location: "456 Side St, Harare", meetings: [
        {id: 1, date: "2024-07-23", messageTitle: "Faith in Action", preacher: "Samuel Green", scripture: "James 2", attendance: 2, offering: 100, notes: "Good discussion."}
      ]}
  ]);

    const [curriculum] = useState<CurriculumWeek[]>(strongChristianAcademyCurriculum);
    const [studentProgress, setStudentProgress] = useState<StudentProgress[]>(mockStudentProgress);
    const [visitations, setVisitations] = useState<Visitation[]>(mockVisitations);
    const [allLeaderStats, setAllLeaderStats] = useState<WeeklyLeaderStats[]>(mockWeeklyLeaderStats);


  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showReminderPreviewModal, setShowReminderPreviewModal] = useState<ChurchEvent | null>(null);
  const [showMemberEditModal, setShowMemberEditModal] = useState<Member | null>(null);
  const [showLeaderStatsModal, setShowLeaderStatsModal] = useState<{ leader: Member; weeklyStats: WeeklyLeaderStats | null; week: { year: number; week: number; } } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
      if (toastMessage) {
          const timer = setTimeout(() => setToastMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toastMessage]);

  const handleUpdateMember = (updatedMember: Member) => {
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setShowMemberEditModal(null);
      setToastMessage("Member details updated successfully!");
  };
  
  const handleAddMember = (newMember: Omit<Member, 'id' | 'messages'>) => {
        const newId = Math.max(...members.map(m => m.id)) + 1;
        const memberWithId: Member = { ...newMember, id: newId, messages: [] };
        
        // Use a functional update to get the latest `members` state for leader assignment
        setMembers(prevMembers => {
            let updatedMembers = [...prevMembers, memberWithId];

            // Auto-assign to 'Bacenta Leader' group if member type is Leader
            if (memberWithId.memberType === 'Leader' && !memberWithId.groups.includes('Bacenta Leader')) {
                memberWithId.groups.push('Bacenta Leader');
                updatedMembers = updatedMembers.map(m => m.id === memberWithId.id ? memberWithId : m);
            }

            // Auto-generate visitation for new converts/first-timers
            const visitationTriggers = ['First Timer(new convert)', 'First Timer(Visitor Only)', 'New member'];
            const needsVisit = visitationTriggers.some(g => newMember.groups.includes(g)) || newMember.memberType === 'New Convert';
            
            if (needsVisit) {
                const leaders = updatedMembers.filter(m => m.memberType === 'Leader' || m.groups.includes('Bacenta Leader'));
                // Assign to a random leader or the first one found. Fallback to a default if none exist.
                const assignedLeaderId = leaders.length > 0 ? leaders[Math.floor(Math.random() * leaders.length)].id : 2;

                const newVisit: Visitation = {
                    id: Math.max(0, ...visitations.map(v => v.id)) + 1,
                    memberId: newId,
                    creationDate: new Date().toISOString().split('T')[0],
                    reason: 'First Timer Follow-up',
                    notes: `${newMember.name} joined as a ${newMember.memberType}.`,
                    priority: 'High',
                    assignedLeaderId,
                    status: 'Pending',
                    report: null
                };
                setVisitations(prevVisits => [newVisit, ...prevVisits]);
                setToastMessage(`${newMember.name} added and scheduled for a follow-up visit!`);
            } else {
                setToastMessage("New member added successfully!");
            }
            
            return updatedMembers;
        });

        setActiveTab("directory");
  };
  
  const handleAddEvent = (newEvent: Omit<ChurchEvent, 'id' | 'rsvps'>) => {
      const newId = Math.max(0, ...events.map(e => e.id)) + 1;
      const eventWithId: ChurchEvent = { ...newEvent, id: newId, rsvps: [] };
      setEvents(prev => [...prev, eventWithId].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setToastMessage("Event created successfully!");
  };

  const handleDeleteEvent = (eventId: number) => {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setToastMessage("Event deleted.");
  };

  const handleRsvp = (eventId: number, memberId: number) => {
      setEvents(prev => prev.map(e => {
          if (e.id === eventId) {
              const newRsvps = e.rsvps.includes(memberId) ? e.rsvps.filter(id => id !== memberId) : [...e.rsvps, memberId];
              return { ...e, rsvps: newRsvps };
          }
          return e;
      }));
  };

  const handleAddBacenta = (newBacenta: Omit<Bacenta, 'id' | 'memberIds' | 'meetings'>) => {
      const newId = Math.max(0, ...bacentas.map(b => b.id)) + 1;
      const bacentaWithId: Bacenta = { ...newBacenta, id: newId, memberIds: [], meetings: [] };
      setBacentas(prev => [...prev, bacentaWithId]);
      setToastMessage("New Bacenta created successfully!");
  };

  const handleUpdateBacenta = (updatedBacenta: Bacenta) => {
      setBacentas(prev => prev.map(b => b.id === updatedBacenta.id ? updatedBacenta : b));
  };
  
  const handleUpdateStudentProgress = (updatedProgress: StudentProgress) => {
      setStudentProgress(prev => prev.map(p => p.studentId === updatedProgress.studentId ? updatedProgress : p));
  };

  const handleEnrollStudent = (studentId: number, teacherId: number) => {
      const newProgress: StudentProgress = {
          studentId,
          teacherId,
          status: 'In Progress',
          attendance: Array(curriculum.length).fill(false),
          notes: Array(curriculum.length).fill(''),
          evidence: Array(curriculum.length).fill(null),
      };
      setStudentProgress(prev => [...prev, newProgress]);
      setToastMessage(`${members.find(m => m.id === studentId)?.name} has been enrolled.`);
  };

  const handleUpdateVisitation = (updatedVisit: Visitation) => {
        setVisitations(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
        setToastMessage("Visitation record updated successfully!");
    };
    
  const handleScheduleVisit = (visitData: Omit<Visitation, 'id' | 'creationDate' | 'status' | 'report'>) => {
        const newVisit: Visitation = {
            ...visitData,
            id: Math.max(0, ...visitations.map(v => v.id)) + 1,
            creationDate: new Date().toISOString().split('T')[0],
            status: 'Pending',
            report: null
        };
        setVisitations(prev => [newVisit, ...prev]);
        setToastMessage(`Visit scheduled for ${members.find(m => m.id === visitData.memberId)?.name}.`);
        setShowMemberEditModal(null); // Close modal after scheduling
    };
  
  const handleUpdateLeaderStats = (updatedStats: WeeklyLeaderStats) => {
      setAllLeaderStats(prev => {
          const index = prev.findIndex(s => s.leaderId === updatedStats.leaderId && s.year === updatedStats.year && s.week === updatedStats.week);
          if (index > -1) {
              const newStats = [...prev];
              newStats[index] = updatedStats;
              return newStats;
          }
          return [...prev, updatedStats];
      });
      setShowLeaderStatsModal(null);
      setToastMessage("Leader stats updated!");
  };

  const totalMembers = members.length;
  const lastServiceAttendance = useMemo(() => {
    const dates = Object.keys(allAttendance).sort();
    if (dates.length === 0) return 0;
    const lastDate = dates[dates.length - 1];
    const record = allAttendance[lastDate];
    if (!record) return 0;
    return record.presentMemberIds.length + record.firstTimersCount + record.newConvertsCount;
  }, [allAttendance]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newMembersCount = members.filter(m => new Date(m.joinDate) >= thirtyDaysAgo).length;
  const newConvertsCount = members.filter(m => m.memberType === 'New Convert').length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent 
            setActiveTab={setActiveTab} 
            setShowEventsModal={setShowEventsModal}
            totalMembers={totalMembers}
            lastServiceAttendance={lastServiceAttendance}
            newMembersCount={newMembersCount}
            newConvertsCount={newConvertsCount}
            upcomingEventsCount={events.length}
            members={members}
        />;
      case 'directory':
        return <MembershipDirectory members={members} setActiveTab={setActiveTab} onEditMember={setShowMemberEditModal} bacentas={bacentas} />;
      case 'add-member':
        return <AddMemberForm onAddMember={handleAddMember} />;
      case 'bulk-upload':
          return <BulkUpload />;
      case 'attendance':
          return <AttendanceTracker
            members={members}
            services={services}
            allAttendance={allAttendance}
            setAllAttendance={setAllAttendance}
          />;
      case 'events':
          return <EventsPage
              events={events}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
          />;
      case 'bacentas':
          return <BacentaManagement 
              bacentas={bacentas}
              members={members}
              onUpdateBacenta={handleUpdateBacenta}
              onAddBacenta={handleAddBacenta}
              setToastMessage={setToastMessage}
          />;
       case 'schools':
            return <SchoolsManagement 
                studentProgress={studentProgress}
                curriculum={curriculum}
                members={members}
                onUpdateStudentProgress={handleUpdateStudentProgress}
                onEnrollStudent={handleEnrollStudent}
            />;
       case 'visitations':
            return <VisitationManagement
                visitations={visitations}
                members={members}
                bacentas={bacentas}
                onUpdateVisitation={handleUpdateVisitation}
            />;
       case 'leadership':
            return <LeadershipBoard
                members={members}
                allLeaderStats={allLeaderStats}
                visitations={visitations}
                bacentas={bacentas}
                studentProgress={studentProgress}
                allAttendance={allAttendance}
                onEditStats={(leader, weeklyStats, week) => setShowLeaderStatsModal({ leader, weeklyStats, week })}
                onEditMember={setShowMemberEditModal}
            />;
      case 'settings':
          return <SettingsPage 
            settings={churchSettings} 
            setSettings={setChurchSettings} 
            services={services}
            setServices={setServices}
          />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header>
          <div className="header-content">
              {churchSettings.logo && <img src={churchSettings.logo} alt="Church Logo" className="church-logo" />}
              <h1>{churchSettings.name}</h1>
          </div>
        <p>Your complete Church Management Solution</p>
        <button className="settings-btn" onClick={() => setActiveTab('settings')} title="Settings">
            <span className="material-symbols-outlined">settings</span>
        </button>
      </header>
      
      <nav className="tabs-nav">
        <TabButton label="Dashboard" icon="dashboard" activeTab={activeTab} onClick={() => setActiveTab('dashboard')} />
        <TabButton label="Directory" icon="groups" activeTab={activeTab} onClick={() => setActiveTab('directory')} />
        <TabButton label="Attendance" icon="checklist" activeTab={activeTab} onClick={() => setActiveTab('attendance')} />
        <TabButton label="Events" icon="event" activeTab={activeTab} onClick={() => setActiveTab('events')} />
        <TabButton label="Bacentas" icon="church" activeTab={activeTab} onClick={() => setActiveTab('bacentas')} />
        <TabButton label="Schools" icon="school" activeTab={activeTab} onClick={() => setActiveTab('schools')} />
        <TabButton label="Visitations" icon="real_estate_agent" activeTab={activeTab} onClick={() => setActiveTab('visitations')} />
        <TabButton label="Leadership" icon="military_tech" activeTab={activeTab} onClick={() => setActiveTab('leadership')} />
      </nav>

      <main>
        {renderContent()}
      </main>

      {showEventsModal && (
          <EventsModal 
              events={events} 
              onClose={() => setShowEventsModal(false)}
              onRsvp={handleRsvp}
              members={members} // assuming memberId 1 is the current user
          />
      )}
      {showReminderPreviewModal && (
          <ReminderPreviewModal
              event={showReminderPreviewModal}
              onClose={() => setShowReminderPreviewModal(null)}
              onSend={() => {
                  setToastMessage(`WhatsApp alerts sent for "${showReminderPreviewModal.name}"!`);
                  setShowReminderPreviewModal(null);
              }}
          />
      )}
      {showMemberEditModal && (
          <MemberEditModal
              member={showMemberEditModal}
              allMembers={members}
              allVisitations={visitations}
              bacentas={bacentas}
              onClose={() => setShowMemberEditModal(null)}
              onSave={handleUpdateMember}
              onScheduleVisit={handleScheduleVisit}
          />
      )}
      {showLeaderStatsModal && (
        <LeaderStatsEditModal
            data={showLeaderStatsModal}
            onClose={() => setShowLeaderStatsModal(null)}
            onSave={handleUpdateLeaderStats}
        />
      )}

      {toastMessage && <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

const TabButton = ({ label, icon, activeTab, onClick }) => (
  <button className={`tab-button ${activeTab.startsWith(label.toLowerCase().replace(' ', '-')) ? 'active' : ''}`} onClick={onClick}>
     <span className="material-symbols-outlined">{icon}</span>
    {label}
  </button>
);

const DashboardContent = ({ setActiveTab, setShowEventsModal, totalMembers, lastServiceAttendance, newMembersCount, newConvertsCount, upcomingEventsCount, members }) => {
    const ageData = useMemo(() => {
        const ageGroups = { '0-11': 0, '12-18': 0, '19-35': 0, '36-55': 0, '55+': 0 };
        members.forEach(member => {
            const age = calculateAge(member.dateOfBirth);
            if (age <= 11) ageGroups['0-11']++;
            else if (age <= 18) ageGroups['12-18']++;
            else if (age <= 35) ageGroups['19-35']++;
            else if (age <= 55) ageGroups['36-55']++;
            else ageGroups['55+']++;
        });
        return Object.entries(ageGroups).map(([label, value]) => ({ label, value }));
    }, [members]);

    const genderData = useMemo(() => {
        const total = members.length;
        if (total === 0) return { male: 0, female: 0};
        const maleCount = members.filter(m => m.gender === 'Male').length;
        return {
            male: (maleCount / total) * 100,
            female: ((total - maleCount) / total) * 100,
        };
    }, [members]);

    const groupDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        CHURCH_GROUPS.forEach(group => counts[group] = 0);
        members.forEach(member => {
            member.groups.forEach(group => {
                if (counts[group] !== undefined) {
                    counts[group]++;
                }
            });
        });
        return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    }, [members]);

    return (
        <>
            <div className="dashboard-grid">
                <DashboardCard icon="groups" label="Total Members" value={totalMembers} onClick={() => setActiveTab('directory')} clickable />
                <DashboardCard icon="how_to_reg" label="Last Service Attendance" value={lastServiceAttendance} onClick={() => setActiveTab('attendance')} clickable />
                <DashboardCard icon="person_add" label="New Members (30d)" value={newMembersCount} onClick={() => setActiveTab('add-member')} clickable />
                <DashboardCard icon="volunteer_activism" label="New Converts" value={newConvertsCount} onClick={() => setActiveTab('directory')} clickable />
                <DashboardCard icon="event" label="Upcoming Events" value={upcomingEventsCount} onClick={() => setShowEventsModal(true)} clickable/>
            </div>
             <div className="demographics-section">
                <h2>Church Demographics & Reports</h2>
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3>Age Distribution</h3>
                        <BarChart data={ageData} />
                    </div>
                    <div className="chart-card">
                        <h3>Gender Distribution</h3>
                        <PieChart data={genderData} />
                    </div>
                    <div className="chart-card wide">
                        <h3>Group Distribution</h3>
                        <BarChart data={groupDistribution} horizontal />
                    </div>
                </div>
            </div>
        </>
    );
};

const DashboardCard = ({ icon, label, value, onClick, clickable = false }) => (
    <div className={`card ${clickable ? 'card--clickable' : ''}`} onClick={onClick}>
        <div className="icon"><span className="material-symbols-outlined">{icon}</span></div>
        <div className="card-content">
            <h3>{label}</h3>
            <p>{value}</p>
        </div>
    </div>
);

const BarChart = ({ data, horizontal = false }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    if (horizontal) {
        return (
            <div className="bar-chart horizontal">
                {data.map(({ label, value }) => (
                    <div key={label} className="bar-wrapper-horizontal">
                        <div className="bar-label-horizontal" title={label}>{label}</div>
                        <div className="bar-horizontal" style={{ width: `${(value / maxValue) * 100}%` }}>
                           <span className="bar-value">{value}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bar-chart">
            {data.map(({ label, value }) => (
                <div key={label} className="bar-wrapper">
                    <div className="bar" style={{ height: `${(value / maxValue) * 100}%` }} title={`${label}: ${value}`}></div>
                    <div className="bar-label">{label}</div>
                </div>
            ))}
        </div>
    );
};

const PieChart = ({ data }) => (
    <div className="pie-chart-container">
        <div className="pie-chart" style={{ background: `conic-gradient(#3b82f6 0% ${data.male}%, #a78bfa ${data.male}% 100%)` }}></div>
        <ul className="legend">
            <li><span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span> Male ({data.male.toFixed(1)}%)</li>
            <li><span className="legend-color" style={{ backgroundColor: '#a78bfa' }}></span> Female ({data.female.toFixed(1)}%)</li>
        </ul>
    </div>
);


const AddMemberForm = ({ onAddMember }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        joinDate: new Date().toISOString().split('T')[0],
        dateOfBirth: '',
        centre: 'Makhaza',
        memberType: 'New Convert',
        gender: 'Male',
        status: 'Pending' as Member['status'],
        groups: [] as string[],
        notes: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (groupName: string) => {
        setFormData(prev => {
            const newGroups = prev.groups.includes(groupName)
                ? prev.groups.filter(g => g !== groupName)
                : [...prev.groups, groupName];
            return { ...prev, groups: newGroups };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.groups.length === 0) {
            setError("A member must belong to at least one group.");
            return;
        }
        if (!formData.dateOfBirth) {
            setError("Date of Birth is a required field.");
            return;
        }
        setError('');
        onAddMember(formData);
        // Reset form
        setFormData({
            name: '', phone: '', email: '', address: '', joinDate: new Date().toISOString().split('T')[0], dateOfBirth: '',
            centre: 'Makhaza', memberType: 'New Convert', gender: 'Male', status: 'Pending', groups: [], notes: ''
        });
    };

    return (
        <div className="form-section card">
            <h2>Add New Member / First-Timer</h2>
            <p>Use this form to add new individuals to the church directory. Ensure all details are accurate.</p>
            <form onSubmit={handleSubmit} className="member-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+27..." required />
                    </div>
                     <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="address">Physical Address</label>
                        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="joinDate">Join Date</label>
                        <input type="date" id="joinDate" name="joinDate" value={formData.joinDate} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="memberType">Member Type</label>
                        <select id="memberType" name="memberType" value={formData.memberType} onChange={handleChange}>
                            <option>New Convert</option>
                            <option>Member</option>
                            <option>Leader</option>
                        </select>
                    </div>
                     <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange}>
                            <option>Pending</option>
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Backsliding</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                            <option>Male</option>
                            <option>Female</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="notes">Notes / Flags</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3}></textarea>
                    </div>
                </div>
                 <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Member Groups (must select at least one)</label>
                    <div className="group-checklist-container">
                        {CHURCH_GROUPS.map(group => (
                            <div key={group} className="group-checklist-item">
                                <input
                                    type="checkbox"
                                    id={`group-${group}`}
                                    checked={formData.groups.includes(group)}
                                    onChange={() => handleGroupChange(group)}
                                />
                                <label htmlFor={`group-${group}`}>{group}</label>
                            </div>
                        ))}
                    </div>
                </div>

                {error && <p className="form-error">{error}</p>}
                
                <button type="submit">Add Member</button>
            </form>
        </div>
    );
};

const BulkUpload = () => {
     const [fileName, setFileName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };
    
    const handleUpload = () => {
        if (fileName) {
            // Simulate upload
            setSuccessMessage(`Successfully uploaded ${fileName}. Members are being processed.`);
            setFileName('');
        }
    };
    
    return (
        <div className="form-section card">
            <h2>Bulk Member Upload</h2>
            <p>Upload a CSV file with member data to add multiple members at once. Please use the provided template to ensure correct formatting.</p>
            
            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="file-upload-area">
                 <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} />
                <label htmlFor="csv-upload" className="file-upload-label">
                    <span className="material-symbols-outlined">upload_file</span>
                    {fileName || 'Click to choose a CSV file'}
                </label>
                <button onClick={handleUpload} disabled={!fileName}>Upload File</button>
            </div>
            <div className="template-download">
                <button className="link-button">Download sample CSV template</button>
            </div>
        </div>
    );
};

const MembershipDirectory = ({ members, setActiveTab, onEditMember, bacentas }) => {
    const [filter, setFilter] = useState({ centre: 'All', gender: 'All', group: 'All', searchTerm: '' });
    const [sort, setSort] = useState({ by: 'name', order: 'asc' });

    const filteredMembers = useMemo(() => {
        return members
            .filter(m => filter.centre === 'All' || m.centre === filter.centre)
            .filter(m => filter.gender === 'All' || m.gender === filter.gender)
            .filter(m => filter.group === 'All' || m.groups.includes(filter.group))
            .filter(m =>
                m.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
                m.phone.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
                m.email.toLowerCase().includes(filter.searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const valA = a[sort.by];
                const valB = b[sort.by];
                if (valA < valB) return sort.order === 'asc' ? -1 : 1;
                if (valA > valB) return sort.order === 'asc' ? 1 : -1;
                return 0;
            });
    }, [members, filter, sort]);

    const handleSort = (key: 'name' | 'joinDate') => {
        if (sort.by === key) {
            setSort(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }));
        } else {
            setSort({ by: key, order: 'asc' });
        }
    };
    
    const findMemberBacenta = (memberId: number): string => {
        const bacenta = bacentas.find(b => b.memberIds.includes(memberId));
        return bacenta ? bacenta.name : 'N/A';
    };
    
    const handleExportCSV = () => {
        const headers = ["Name", "Age", "Gender", "Address", "Phone", "Email", "Bacenta", "Status", "Join Date", "Notes"];
        const csvRows = [headers.join(',')];

        filteredMembers.forEach(member => {
            const row = [
                `"${member.name}"`,
                calculateAge(member.dateOfBirth),
                `"${member.gender}"`,
                `"${member.address || ''}"`,
                `"${member.phone}"`,
                `"${member.email}"`,
                `"${findMemberBacenta(member.id)}"`,
                `"${member.status}"`,
                `"${member.joinDate}"`,
                `"${(member.notes || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "church_directory.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handlePrint = () => {
        window.print();
    };


    return (
        <div className="directory-container card">
            <h2 className="print-only-title">{members.find(m => m.id === 1)?.name}'s Church Membership Directory</h2>
            <div className="page-header">
                <h2>Church Membership Directory</h2>
                <div className="header-actions">
                    <button onClick={handleExportCSV} className="secondary-btn">
                        <span className="material-symbols-outlined">download</span> Export CSV
                    </button>
                    <button onClick={handlePrint} className="secondary-btn">
                        <span className="material-symbols-outlined">print</span> Print PDF
                    </button>
                    <button onClick={() => setActiveTab('add-member')}>
                         <span className="material-symbols-outlined">add</span> Add New Member
                    </button>
                </div>
            </div>

            <div className="directory-controls">
                <div className="control-group">
                    <select value={filter.centre} onChange={e => setFilter(p => ({ ...p, centre: e.target.value }))}>
                        <option value="All">All Centres</option>
                        <option value="Makhaza">Makhaza Centre</option>
                        <option value="Other">Other</option>
                    </select>
                    <select value={filter.gender} onChange={e => setFilter(p => ({ ...p, gender: e.target.value }))}>
                        <option value="All">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <select value={filter.group} onChange={e => setFilter(p => ({ ...p, group: e.target.value }))}>
                        <option value="All">All Groups</option>
                        {CHURCH_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="search-bar">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Search by name, phone, email..."
                        value={filter.searchTerm}
                        onChange={e => setFilter(p => ({...p, searchTerm: e.target.value}))}
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="member-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')}>Name {sort.by === 'name' && (sort.order === 'asc' ? '▲' : '▼')}</th>
                            <th>Member Type</th>
                            <th>Age</th>
                            <th>Status</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th onClick={() => handleSort('joinDate')}>Join Date {sort.by === 'joinDate' && (sort.order === 'asc' ? '▲' : '▼')}</th>
                            <th>Groups</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map(member => (
                            <tr key={member.id} onClick={() => onEditMember(member)}>
                                <td>{member.name}</td>
                                <td>{member.memberType}</td>
                                <td>{calculateAge(member.dateOfBirth)}</td>
                                <td><span className={`status-badge status-${member.status.toLowerCase()}`}>{member.status}</span></td>
                                <td>{member.phone}</td>
                                <td>{member.email}</td>
                                <td>{member.joinDate}</td>
                                <td>{member.groups.join(', ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AttendanceTracker = ({ members, services, allAttendance, setAllAttendance }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedService, setSelectedService] = useState<Service | null>(services[0] || null);
    const [filter, setFilter] = useState({ gender: 'All', searchTerm: '' });
    
    const leaders = useMemo(() => members.filter(m => m.memberType === 'Leader' || m.groups.includes('Bacenta Leader')), [members]);
    
    const isPastDate = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(selectedDate);
        date.setHours(0,0,0,0);
        return date < today;
    }, [selectedDate]);

    const currentRecord = useMemo<ServiceAttendanceRecord>(() => {
        return allAttendance[selectedDate] || {
            serviceName: selectedService?.name || '',
            preacher: '',
            messageTitle: '',
            presentMemberIds: [],
            firstTimersCount: 0,
            newConvertsCount: 0,
        };
    }, [allAttendance, selectedDate, selectedService]);

    const { adultsCount, kidsCount } = useMemo(() => {
        let adults = 0;
        let kids = 0;
        currentRecord.presentMemberIds.forEach(id => {
            const member = members.find(m => m.id === id);
            if (member) {
                const age = calculateAge(member.dateOfBirth);
                if (age < 12) {
                    kids++;
                } else {
                    adults++;
                }
            }
        });
        return { adultsCount: adults, kidsCount: kids };
    }, [currentRecord.presentMemberIds, members]);

    const totalAttendance = adultsCount + kidsCount + (currentRecord.firstTimersCount || 0) + (currentRecord.newConvertsCount || 0);

    const handleSummaryChange = (field: keyof Omit<ServiceAttendanceRecord, 'presentMemberIds' | 'serviceName'>, value: string | number) => {
        if (!selectedService) return;

        const updatedRecord: ServiceAttendanceRecord = {
            ...currentRecord,
            serviceName: selectedService.name,
            [field]: typeof value === 'number' ? value : (field === 'preacher' || field === 'messageTitle' ? value : 0)
        };
        
        setAllAttendance(prev => ({ ...prev, [selectedDate]: updatedRecord }));
    };

    const toggleCheckIn = (memberId: number) => {
        if (isPastDate || !selectedService) return;

        const isPresent = currentRecord.presentMemberIds.includes(memberId);
        const newPresentIds = isPresent
            ? currentRecord.presentMemberIds.filter(id => id !== memberId)
            : [...currentRecord.presentMemberIds, memberId];
        
        const updatedRecord: ServiceAttendanceRecord = {
            ...currentRecord,
            serviceName: selectedService.name,
            presentMemberIds: newPresentIds
        };
        setAllAttendance(prev => ({ ...prev, [selectedDate]: updatedRecord }));
    };
    
    const filteredMembers = useMemo(() => {
        return members
            .filter(r => filter.gender === 'All' || r.gender === filter.gender)
            .filter(r => r.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) || r.phone.includes(filter.searchTerm));
    }, [members, filter]);
    
    const generateReportText = (forWhatsApp = false) => {
        const bold = (text: string) => forWhatsApp ? `*${text}*` : text;

        let report = `${bold('Attendance Report')}\n\n`;
        report += `*Date:* ${new Date(selectedDate).toDateString()}\n`;
        report += `*Service:* ${selectedService?.name || 'N/A'}\n`;
        report += `*Preacher:* ${currentRecord.preacher || 'N/A'}\n`;
        report += `*Message Preached:* ${currentRecord.messageTitle || 'N/A'}\n\n`;
        report += `--- ${bold('SUMMARY')} ---\n`;
        report += `Adults: ${adultsCount}\n`;
        report += `Kids: ${kidsCount}\n`;
        report += `First Timers: ${currentRecord.firstTimersCount}\n`;
        report += `New Converts: ${currentRecord.newConvertsCount}\n`;
        report += `${bold('Total Attendance: ')} ${totalAttendance}\n\n`;
        report += `--- ${bold('PRESENT MEMBERS')} ---\n`;
        members.filter(m => currentRecord.presentMemberIds.includes(m.id))
               .forEach(m => { report += `- ${m.name}\n`; });
        
        return report;
    };

    const handleShareWhatsApp = () => {
        if (!selectedService) return;
        const report = generateReportText(true);
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(report)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleDownloadReport = () => {
        if (!selectedService) return;
        const report = generateReportText(false);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${selectedDate}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="attendance-container card">
             <div className="page-header">
                <h2>Attendance Tracker</h2>
                <div className="header-actions">
                    <button onClick={handleShareWhatsApp} className="secondary-btn" disabled={!selectedService}><span className="material-symbols-outlined">share</span> Send via WhatsApp</button>
                    <button onClick={handleDownloadReport} className="secondary-btn" disabled={!selectedService}><span className="material-symbols-outlined">download</span> Download Report</button>
                </div>
            </div>

            <div className="service-selection-container">
                <div className="form-group">
                    <label>Select Date</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                 <div className="form-group">
                     <label>Select Service</label>
                    <select onChange={e => setSelectedService(services.find(s => s.name === e.target.value) || null)} value={selectedService?.name || ''}>
                        <option value="">Choose a service...</option>
                        {services.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                {isPastDate && <div className="info-message" style={{gridColumn: '1 / -1'}}>Viewing historical record. Check-in is disabled.</div>}
            </div>
            
             <div className={`attendance-content ${!selectedService ? 'content-disabled' : ''}`}>
                 <div className="attendance-summary-card">
                    <div className="summary-item">
                        <label htmlFor="preacher">Preacher</label>
                        <select id="preacher" value={currentRecord.preacher} onChange={e => handleSummaryChange('preacher', e.target.value)}>
                            <option value="">Select Preacher</option>
                            {leaders.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                        </select>
                    </div>
                     <div className="summary-item">
                        <label htmlFor="messageTitle">Message Preached</label>
                        <input id="messageTitle" type="text" value={currentRecord.messageTitle || ''} onChange={e => handleSummaryChange('messageTitle', e.target.value)} placeholder="e.g., The Good Shepherd"/>
                    </div>
                    <div className="summary-item">
                        <label>Adults</label>
                        <span className="summary-value">{adultsCount}</span>
                    </div>
                    <div className="summary-item">
                        <label>Kids (&lt;12)</label>
                        <span className="summary-value">{kidsCount}</span>
                    </div>
                    <div className="summary-item">
                        <label htmlFor="firstTimers">First Timers</label>
                        <input id="firstTimers" type="number" min="0" value={currentRecord.firstTimersCount} onChange={e => handleSummaryChange('firstTimersCount', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="summary-item">
                        <label htmlFor="newConverts">New Converts</label>
                        <input id="newConverts" type="number" min="0" value={currentRecord.newConvertsCount} onChange={e => handleSummaryChange('newConvertsCount', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="summary-item">
                        <label>Total Attendance</label>
                        <span className="summary-value" style={{color: 'var(--primary-color)'}}>{totalAttendance}</span>
                    </div>
                </div>

                <div className="attendance-controls">
                    <div className="control-group">
                         <select onChange={e => setFilter(p => ({...p, gender: e.target.value}))}>
                            <option value="All">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="search-bar">
                         <span className="material-symbols-outlined">search</span>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                             onChange={e => setFilter(p => ({...p, searchTerm: e.target.value}))}
                        />
                    </div>
                </div>

                <div className="attendance-list">
                    <div className="list-header">
                        <span>Member</span>
                        <span>Status</span>
                        <span>Action</span>
                    </div>
                    {filteredMembers.map(record => {
                        const isCheckedIn = currentRecord.presentMemberIds.includes(record.id);
                        return (
                            <div key={record.id} className="attendance-item">
                                <div className="member-info">
                                    <strong>{record.name}</strong>
                                    <span>{record.phone}</span>
                                </div>
                                <span className={`status-label ${isCheckedIn ? 'status-checked-in' : 'status-unchecked'}`}>
                                    {isCheckedIn ? 'Present' : 'Absent'}
                                </span>
                                <div className="attendance-action">
                                    <button
                                        onClick={() => toggleCheckIn(record.id)}
                                        className={`check-in-btn ${isCheckedIn ? 'undo' : ''}`}
                                        disabled={isPastDate}
                                    >
                                        {isCheckedIn ? 'Mark Absent' : 'Mark Present'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SettingsPage = ({ settings, setSettings, services, setServices }) => {
    const [newServiceName, setNewServiceName] = useState('');
    const [newServiceTime, setNewServiceTime] = useState('');

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    setSettings(prev => ({ ...prev, logo: event.target.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        if (newServiceName && newServiceTime && !services.some(s => s.name === newServiceName)) {
            setServices(prev => [...prev, { name: newServiceName, time: newServiceTime }]);
            setNewServiceName('');
            setNewServiceTime('');
        }
    };
    
    const handleRemoveService = (serviceName: string) => {
        setServices(prev => prev.filter(s => s.name !== serviceName));
    };

    return (
        <div className="settings-page">
            <div className="settings-section card">
                <h2>Church Settings</h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Church Logo</label>
                        <div className="logo-uploader">
                            <img src={settings.logo} alt="Logo Preview" className="logo-preview" />
                            <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoChange} style={{display: 'none'}} />
                            <label htmlFor="logo-upload" className="file-upload-label" style={{flex: 1}}>
                                 <span className="material-symbols-outlined">upload</span> Upload New Logo
                            </label>
                        </div>
                    </div>
                     <div className="form-group">
                        <label htmlFor="name">Church Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={settings.name}
                            onChange={handleSettingsChange}
                        />
                    </div>
                </div>
            </div>

            <div className="settings-section card">
                <h2>Service Settings</h2>
                <form className="add-item-form" onSubmit={handleAddService}>
                    <input
                        type="text"
                        placeholder="New Service Name (e.g., Evening Worship)"
                        value={newServiceName}
                        onChange={e => setNewServiceName(e.target.value)}
                        required
                    />
                     <input
                        type="time"
                        value={newServiceTime}
                        onChange={e => setNewServiceTime(e.target.value)}
                        required
                    />
                    <button type="submit">
                         <span className="material-symbols-outlined">add</span> Add Service
                    </button>
                </form>
                <ul className="item-list">
                    {services.map(service => (
                        <li key={service.name}>
                            <span><strong>{service.name}</strong> ({service.time})</span>
                            <div className="item-actions">
                                <button className="remove-btn" onClick={() => handleRemoveService(service.name)}>
                                     <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const EventsPage = ({ events, onAddEvent, onDeleteEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month', 'week', 'year'

    const handlePrev = () => {
        if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
        if (view === 'week') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
        if (view === 'year') setCurrentDate(d => new Date(d.getFullYear() - 1, 0, 1));
    };

    const handleNext = () => {
        if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        if (view === 'week') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
        if (view === 'year') setCurrentDate(d => new Date(d.getFullYear() + 1, 0, 1));
    };

    const renderCalendar = () => {
        switch (view) {
            case 'month': return <MonthView date={currentDate} events={events} />;
            case 'week': return <WeekView date={currentDate} events={events} />;
            case 'year': return <YearView date={currentDate} events={events} />;
            default: return null;
        }
    };
    
    const getHeaderText = () => {
        switch (view) {
            case 'month': return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            case 'week': 
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'year': return currentDate.getFullYear();
            default: return '';
        }
    };

    return (
        <div className="events-page">
            <div className="calendar-container card">
                <div className="calendar-header">
                    <div className="calendar-nav">
                        <button onClick={handlePrev}><span className="material-symbols-outlined">chevron_left</span></button>
                        <h2>{getHeaderText()}</h2>
                        <button onClick={handleNext}><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                     <div className="calendar-view-switcher">
                        <button onClick={() => setView('month')} className={view === 'month' ? 'active' : ''}>Month</button>
                        <button onClick={() => setView('week')} className={view === 'week' ? 'active' : ''}>Week</button>
                        <button onClick={() => setView('year')} className={view === 'year' ? 'active' : ''}>Year</button>
                    </div>
                </div>
                {renderCalendar()}
            </div>
            <div className="event-sidebar">
                <AddEventSideBar onAddEvent={onAddEvent} />
                <ManageEventsSideBar events={events} onDeleteEvent={onDeleteEvent} />
            </div>
        </div>
    );
};

const MonthView = ({ date, events }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({ length: firstDay }, (_, i) => new Date(year, month, i - firstDay + 1))
        .concat(Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)));

    return (
        <>
            <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="calendar-grid month">
                {days.map((day, index) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isOtherMonth = day.getMonth() !== month;
                    const dayEvents = events.filter(e => new Date(e.date).toDateString() === day.toDateString());

                    return (
                        <div key={index} className={`calendar-day ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}`}>
                            <div className="day-number">{day.getDate()}</div>
                            <div className="events-in-day">
                                {dayEvents.map(event => <div key={event.id} className="event-chip" title={event.name}>{event.name}</div>)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const WeekView = ({ date, events }) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <>
            <div className="calendar-weekdays">
                {days.map(d => <div key={d.toISOString()}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>)}
            </div>
            <div className="calendar-grid week">
                {days.map(day => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    const dayEvents = events.filter(e => new Date(e.date).toDateString() === day.toDateString());
                    return (
                        <div key={day.toISOString()} className={`calendar-day ${isToday ? 'today' : ''}`}>
                            <div className="day-number">{day.getDate()}</div>
                             <div className="events-in-day">
                                {dayEvents.map(event => <div key={event.id} className="event-chip" title={event.name}>{event.name}</div>)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const YearView = ({ date, events }) => {
    const year = date.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
    
    return (
        <div className="calendar-grid year">
            {months.map(monthDate => {
                const month = monthDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDay = new Date(year, month, 1).getDay();
                const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
                const monthEvents = events.filter(e => new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() === month);

                return (
                    <div key={month} className="month-grid-small">
                        <h4>{monthDate.toLocaleDateString('en-US', { month: 'long' })}</h4>
                        <div className="year-view-days">
                             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} style={{fontWeight: 600, color: '#64748b'}}>{d}</span>)}
                        </div>
                        <div className="year-view-days">
                           {days.map((day, index) => {
                                if (!day) return <span key={`empty-${index}`}></span>;
                                const currentDate = new Date(year, month, day);
                                const isToday = new Date().toDateString() === currentDate.toDateString();
                                const hasEvents = monthEvents.some(e => new Date(e.date).getDate() === day);
                                return <span key={day} className={`${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`}>{day}</span>;
                           })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const AddEventSideBar = ({ onAddEvent }) => {
    const [formData, setFormData] = useState({
        name: '', date: '', time: '', location: '', organizer: '',
        targetGroup: 'All Members', description: '', reminderEnabled: false,
        reminderTime: '1 day before' as ChurchEvent['reminderTime'],
        messageTemplate: 'standard' as ChurchEvent['messageTemplate'],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddEvent(formData);
        // Reset form
        setFormData({
            name: '', date: '', time: '', location: '', organizer: '',
            targetGroup: 'All Members', description: '', reminderEnabled: false,
            reminderTime: '1 day before', messageTemplate: 'standard',
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div className="card">
            <h3>Add New Event</h3>
             <form onSubmit={handleSubmit} className="event-form">
                <div className="form-grid compact">
                    <div className="form-group">
                        <label>Event Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                     <div className="form-group">
                        <label>Date & Time</label>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{flex: 2}} />
                            <input type="time" name="time" value={formData.time} onChange={handleChange} required style={{flex: 1}} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Organizer</label>
                        <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} />
                    </div>
                     <div className="form-group">
                        <label>Target Group</label>
                        <select name="targetGroup" value={formData.targetGroup} onChange={handleChange}>
                           <option>All Members</option>
                           <option>Youth</option>
                           <option>Choir Only</option>
                           <option>Leaders</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Alerts & Reminders</label>
                         <div className="group-checklist-item">
                           <input type="checkbox" id="reminderEnabled" name="reminderEnabled" checked={formData.reminderEnabled} onChange={handleChange} />
                           <label htmlFor="reminderEnabled">Enable WhatsApp Reminders</label>
                        </div>
                        {formData.reminderEnabled && (
                            <div className="reminder-options" style={{marginTop: '0.5rem'}}>
                                <select name="reminderTime" value={formData.reminderTime} onChange={handleChange}>
                                    <option>1 day before</option>
                                    <option>2 hours before</option>
                                    <option>1 hour before</option>
                                </select>
                                <select name="messageTemplate" value={formData.messageTemplate} onChange={handleChange} style={{marginTop: '0.5rem'}}>
                                    <option value="standard">Standard Service</option>
                                    <option value="youth">Youth Special</option>
                                    <option value="meeting">Meeting Reminder</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <button type="submit">Add Event</button>
            </form>
        </div>
    );
};

const ManageEventsSideBar = ({ events, onDeleteEvent }) => (
    <div className="card">
        <h3>Manage Events</h3>
        <ul className="item-list" style={{maxHeight: '300px', overflowY: 'auto', paddingRight: '10px'}}>
            {events.map(event => (
                <li key={event.id}>
                    <span>
                        <strong>{event.name}</strong>
                        <br/>
                        <small>{new Date(event.date).toLocaleDateString()}</small>
                    </span>
                    <div className="item-actions">
                        <button className="remove-btn" onClick={() => onDeleteEvent(event.id)}>
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

const EventsModal = ({ events, onClose, onRsvp, members }) => {
    const currentUserId = 1; // Mock current user
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upcoming Events</h2>
                    <button onClick={onClose} className="close-button"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="events-list">
                    {events.length > 0 ? events.map(event => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-header">
                                <h3>{event.name}</h3>
                                <span className="event-target-group">{event.targetGroup}</span>
                            </div>
                            <p className="event-description">"{event.description}"</p>
                            <div className="event-details">
                                <span><span className="material-symbols-outlined">calendar_month</span> {new Date(event.date).toDateString()}</span>
                                <span><span className="material-symbols-outlined">schedule</span> {event.time}</span>
                                <span><span className="material-symbols-outlined">location_on</span> {event.location}</span>
                                <span><span className="material-symbols-outlined">person</span> Organized by: {event.organizer}</span>
                            </div>
                             <div className="event-rsvp">
                                <span>
                                    <span className="material-symbols-outlined">groups</span>
                                    {event.rsvps.length} going
                                </span>
                                <button onClick={() => onRsvp(event.id, currentUserId)} disabled={event.rsvps.includes(currentUserId)}>
                                    {event.rsvps.includes(currentUserId) ? '✔ Attending' : 'RSVP'}
                                </button>
                            </div>
                        </div>
                    )) : <p>No upcoming events.</p>}
                </div>
            </div>
        </div>
    );
};

const ToastNotification = ({ message, onClose }) => (
    <div className="toast-notification">
        <span className="material-symbols-outlined">check_circle</span>
        <p>{message}</p>
        <button className="close-toast-btn" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
    </div>
);

const ReminderPreviewModal = ({ event, onClose, onSend }) => {
    const message = messageTemplates[event.messageTemplate](event);
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content reminder-preview-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Send Reminder</h2>
                    <button onClick={onClose} className="close-button"><span className="material-symbols-outlined">close</span></button>
                </div>
                <p>You are about to send the following WhatsApp message to the "<strong>{event.targetGroup}</strong>" group for the event "<strong>{event.name}</strong>".</p>
                <div className="whatsapp-preview">
                    <div className="whatsapp-message">{message}</div>
                </div>
                <div className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button onClick={onSend}>Send Now</button>
                </div>
            </div>
        </div>
    );
};

const MemberEditModal = ({ member, allMembers, allVisitations, bacentas, onClose, onSave, onScheduleVisit }) => {
    const [activeModalTab, setActiveModalTab] = useState('details');
    const [editedMember, setEditedMember] = useState<Member>(member);
    const [error, setError] = useState('');
    const [visitFormData, setVisitFormData] = useState({
        reason: 'General Check-in' as Visitation['reason'],
        notes: '',
        priority: 'Medium' as Visitation['priority'],
        assignedLeaderId: 0,
    });
    
    const leaders = useMemo(() => {
        return allMembers.filter(m => m.memberType === 'Leader' || m.groups.includes('Bacenta Leader'));
    }, [allMembers]);

    const memberVisitations = useMemo(() => {
        return allVisitations
            .filter(v => v.memberId === member.id)
            .sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    }, [allVisitations, member.id]);

    useEffect(() => {
        if (leaders.length > 0 && visitFormData.assignedLeaderId === 0) {
            setVisitFormData(prev => ({ ...prev, assignedLeaderId: leaders[0].id }));
        }
    }, [leaders, visitFormData.assignedLeaderId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedMember(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (groupName: string) => {
        setEditedMember(prev => {
            const newGroups = prev.groups.includes(groupName)
                ? prev.groups.filter(g => g !== groupName)
                : [...prev.groups, groupName];
            return { ...prev, groups: newGroups };
        });
    };
    
    const handleVisitFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setVisitFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScheduleVisitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitFormData.assignedLeaderId) {
            alert("Please assign a leader for the visit.");
            return;
        }
        onScheduleVisit({
            ...visitFormData,
            memberId: member.id,
            assignedLeaderId: Number(visitFormData.assignedLeaderId)
        });
    };

    const handleSaveChanges = () => {
        if (editedMember.groups.length === 0) {
            setError("A member must belong to at least one group.");
            return;
        }
        setError('');

        let finalMember = { ...editedMember };
        const wasLeader = member.memberType === 'Leader';
        const isNowLeader = finalMember.memberType === 'Leader';
        
        // Becoming a leader: Add to 'Bacenta Leader' group if not already there.
        if (!wasLeader && isNowLeader) {
            if (!finalMember.groups.includes('Bacenta Leader')) {
                finalMember.groups.push('Bacenta Leader');
            }
        } 
        // No longer a leader: Remove from leader-specific groups.
        else if (wasLeader && !isNowLeader) {
             finalMember.groups = finalMember.groups.filter(g => g !== 'Bacenta Leader' && g !== 'Basonta Leader');
        }

        onSave(finalMember);
    };
    
    const findMemberBacenta = (memberId: number): string => {
        const bacenta = bacentas.find(b => b.memberIds.includes(memberId));
        return bacenta ? bacenta.name : 'N/A';
    };

    const handleShareViaWhatsApp = () => {
        const googleMapsLink = member.address ? `https://www.google.com/maps?q=${encodeURIComponent(member.address)}` : 'N/A';
        const message = `
Member Details:
Name: ${member.name}
Age: ${calculateAge(member.dateOfBirth)}
Bacenta: ${findMemberBacenta(member.id)}
Status: ${member.status}
Phone: ${member.phone}
Address: ${member.address || 'N/A'} ${member.address ? `(Open in Maps: ${googleMapsLink})` : ''}
        `.trim().replace(/^\s+/gm, '');
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content member-edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Member Profile: {member.name}</h2>
                    <button onClick={onClose} className="close-button"><span className="material-symbols-outlined">close</span></button>
                </div>
                 <div className="modal-tabs">
                    <button onClick={() => setActiveModalTab('details')} className={`modal-tab ${activeModalTab === 'details' ? 'active' : ''}`}>Details</button>
                    <button onClick={() => setActiveModalTab('visitation-history')} className={`modal-tab ${activeModalTab === 'visitation-history' ? 'active' : ''}`}>Visitation History</button>
                    <button onClick={() => setActiveModalTab('messages')} className={`modal-tab ${activeModalTab === 'messages' ? 'active' : ''}`}>Message History</button>
                    <button onClick={() => setActiveModalTab('schedule-visit')} className={`modal-tab ${activeModalTab === 'schedule-visit' ? 'active' : ''}`}>Schedule Visit</button>
                </div>
                <div className="modal-body">
                    {activeModalTab === 'details' && (
                        <div>
                             <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" value={editedMember.name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="text" name="phone" value={editedMember.phone} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" name="email" value={editedMember.email} onChange={handleChange} />
                                </div>
                                 <div className="form-group">
                                    <label>Address</label>
                                    <textarea name="address" rows={2} value={editedMember.address} onChange={handleChange}></textarea>
                                    {editedMember.address && (
                                        <a href={`https://www.google.com/maps?q=${encodeURIComponent(editedMember.address)}`} target="_blank" rel="noopener noreferrer" className="map-link">
                                            <span className="material-symbols-outlined">map</span> Open in Maps
                                        </a>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" name="dateOfBirth" value={editedMember.dateOfBirth} onChange={handleChange} />
                                </div>
                                 <div className="form-group">
                                    <label>Photo URL</label>
                                    <input type="text" name="photoUrl" value={editedMember.photoUrl} onChange={handleChange} placeholder="https://example.com/photo.jpg" />
                                </div>
                                 <div className="form-group">
                                    <label>Member Type</label>
                                    <select name="memberType" value={editedMember.memberType} onChange={handleChange}>
                                        <option>New Convert</option>
                                        <option>Member</option>
                                        <option>Leader</option>
                                    </select>
                                </div>
                                 <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={editedMember.status} onChange={handleChange}>
                                        <option>Active</option>
                                        <option>Inactive</option>
                                        <option>Pending</option>
                                        <option>Backsliding</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Notes / Flags</label>
                                    <textarea name="notes" rows={3} value={editedMember.notes || ''} onChange={handleChange}></textarea>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Member Groups (must select at least one)</label>
                                <div className="group-checklist-container">
                                    {CHURCH_GROUPS.map(group => (
                                        <div key={group} className="group-checklist-item">
                                            <input
                                                type="checkbox"
                                                id={`edit-group-${group}`}
                                                checked={editedMember.groups.includes(group)}
                                                onChange={() => handleGroupChange(group)}
                                            />
                                            <label htmlFor={`edit-group-${group}`}>{group}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             {error && <p className="form-error" style={{textAlign: 'center'}}>{error}</p>}
                        </div>
                    )}
                    {activeModalTab === 'visitation-history' && (
                        <div className="visitation-history-list">
                            {memberVisitations.length > 0 ? memberVisitations.map(visit => {
                                const leader = allMembers.find(m => m.id === visit.assignedLeaderId);
                                return (
                                    <div key={visit.id} className="visit-history-item">
                                        <div className="visit-history-info">
                                            <p><strong>Reason:</strong> {visit.reason}</p>
                                            <small><strong>Date Created:</strong> {new Date(visit.creationDate).toLocaleDateString()} | <strong>Assigned to:</strong> {leader?.name || 'N/A'}</small>
                                        </div>
                                        <span className={`status-badge status-${visit.status.toLowerCase().replace(' ', '-')}`}>{visit.status}</span>
                                    </div>
                                );
                            }) : <p>No visitation history found for this member.</p>}
                        </div>
                    )}
                    {activeModalTab === 'messages' && (
                        <div className="message-history-list">
                            {member.messages.length > 0 ? member.messages.map(msg => (
                                <div key={msg.id} className="message-item">
                                    <div className="message-content">
                                        <p>{msg.content}</p>
                                        <small>{new Date(msg.date).toLocaleString()}</small>
                                    </div>
                                     <div className={`message-status status-${msg.status.toLowerCase()}`}>
                                        {msg.status}
                                        {msg.status === 'Received' && <span className="material-symbols-outlined">done_all</span>}
                                    </div>
                                </div>
                            )) : <p>No message history found for this member.</p>}
                        </div>
                    )}
                    {activeModalTab === 'schedule-visit' && (
                        <div>
                            <form onSubmit={handleScheduleVisitSubmit} className="schedule-visit-form">
                                <p style={{marginBottom: '1rem'}}>Schedule a new follow-up visit for <strong>{member.name}</strong>.</p>
                                <div className="form-group">
                                    <label htmlFor="reason">Reason for Visit</label>
                                    <select id="reason" name="reason" value={visitFormData.reason} onChange={handleVisitFormChange}>
                                        <option value="General Check-in">General Check-in</option>
                                        <option value="First Timer Follow-up">First Timer Follow-up</option>
                                        <option value="Missed Service">Missed Service</option>
                                        <option value="Encouragement">Encouragement</option>
                                        <option value="Leader Report">Leader Report</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="priority">Priority</label>
                                    <select id="priority" name="priority" value={visitFormData.priority} onChange={handleVisitFormChange}>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="assignedLeaderId">Assign to Leader</label>
                                    <select id="assignedLeaderId" name="assignedLeaderId" value={visitFormData.assignedLeaderId} onChange={handleVisitFormChange} required>
                                        {leaders.length > 0 ? (
                                            leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                                        ) : (
                                            <option disabled>No leaders available</option>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="notes">Notes / Details</label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={4}
                                        value={visitFormData.notes}
                                        onChange={handleVisitFormChange}
                                        placeholder="Provide context for the visit..."
                                    ></textarea>
                                </div>
                                <button type="submit" style={{marginTop: '1rem', width: '100%'}}>Schedule Visit</button>
                            </form>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="secondary-btn" onClick={handleShareViaWhatsApp}>
                        <span className="material-symbols-outlined">share</span> Share via WhatsApp
                    </button>
                    <div style={{flexGrow: 1}}></div>
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    {activeModalTab === 'details' && <button onClick={handleSaveChanges}>Save Changes</button>}
                </div>
            </div>
        </div>
    );
};

const BacentaManagement = ({ bacentas, members, onUpdateBacenta, onAddBacenta, setToastMessage }) => {
    const [view, setView] = useState('list'); // 'list', 'details', 'add'
    const [selectedBacenta, setSelectedBacenta] = useState<Bacenta | null>(null);

    const handleSelectBacenta = (bacenta: Bacenta) => {
        setSelectedBacenta(bacenta);
        setView('details');
    };
    
    const handleAddBacenta = (newBacentaData: Omit<Bacenta, 'id' | 'memberIds' | 'meetings'>) => {
        onAddBacenta(newBacentaData);
        setView('list');
    };

    switch (view) {
        case 'details':
            return <BacentaDetailsPage 
                bacenta={selectedBacenta!}
                allMembers={members}
                onBack={() => setView('list')}
                onUpdateBacenta={onUpdateBacenta}
            />;
        case 'add':
            return <AddBacentaPage 
                leaders={members.filter(m => m.groups.includes('Bacenta Leader'))}
                onAddBacenta={handleAddBacenta}
                onBack={() => setView('list')}
            />;
        case 'list':
        default:
            return <AllBacentasPage 
                bacentas={bacentas} 
                members={members} 
                onSelectBacenta={handleSelectBacenta} 
                onAddNew={() => setView('add')}
            />;
    }
};

const AllBacentasPage = ({ bacentas, members, onSelectBacenta, onAddNew }) => (
    <div className="card">
        <div className="page-header">
            <h2>All Bacentas</h2>
            <button onClick={onAddNew}><span className="material-symbols-outlined">add</span> Add New Bacenta</button>
        </div>
        <div className="bacentas-grid">
            {bacentas.map(bacenta => {
                const leader = members.find(m => m.id === bacenta.leaderId);
                return (
                    <div key={bacenta.id} className="bacenta-card" onClick={() => onSelectBacenta(bacenta)}>
                        <h3>{bacenta.name}</h3>
                        <div className="bacenta-card-details">
                            <span><span className="material-symbols-outlined">person</span> {leader ? leader.name : 'N/A'}</span>
                            <span><span className="material-symbols-outlined">groups</span> {bacenta.memberIds.length} Members</span>
                            <span><span className="material-symbols-outlined">schedule</span> {bacenta.meetingDay} at {bacenta.meetingTime}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const AddBacentaPage = ({ leaders, onAddBacenta, onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        leaderId: leaders[0]?.id || 0,
        meetingDay: 'Monday',
        meetingTime: '18:00',
        location: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({...p, [name]: name === 'leaderId' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddBacenta(formData);
    };

    return (
        <div className="form-section card">
             <div className="page-header">
                <h2>Create New Bacenta</h2>
                <button onClick={onBack} className="back-button"><span className="material-symbols-outlined">arrow_back</span> Back to List</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Bacenta Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Bacenta Leader</label>
                         <select name="leaderId" value={formData.leaderId} onChange={handleChange} required>
                           {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Meeting Day</label>
                         <select name="meetingDay" value={formData.meetingDay} onChange={handleChange}>
                           {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Meeting Time</label>
                        <input type="time" name="meetingTime" value={formData.meetingTime} onChange={handleChange} required />
                    </div>
                     <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Location / Address</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                    </div>
                </div>
                <button type="submit">Create Bacenta</button>
            </form>
        </div>
    );
};

const BacentaDetailsPage = ({ bacenta: initialBacenta, allMembers, onBack, onUpdateBacenta }) => {
    const [bacenta, setBacenta] = useState(initialBacenta);
    const [memberToAdd, setMemberToAdd] = useState('');
    const [meetingLog, setMeetingLog] = useState({
        date: new Date().toISOString().split('T')[0], messageTitle: '', preacher: '',
        scripture: '', attendance: 0, offering: 0, notes: ''
    });

    const leader = allMembers.find(m => m.id === bacenta.leaderId);
    const members = allMembers.filter(m => bacenta.memberIds.includes(m.id));
    const availableMembers = allMembers.filter(m => !bacenta.memberIds.includes(m.id));

    const handleAddMember = () => {
        const memberId = parseInt(memberToAdd);
        if (memberId && !bacenta.memberIds.includes(memberId)) {
            const updatedBacenta = { ...bacenta, memberIds: [...bacenta.memberIds, memberId] };
            setBacenta(updatedBacenta);
            onUpdateBacenta(updatedBacenta);
        }
    };
    
    const handleRemoveMember = (memberId: number) => {
        const updatedBacenta = { ...bacenta, memberIds: bacenta.memberIds.filter(id => id !== memberId) };
        setBacenta(updatedBacenta);
        onUpdateBacenta(updatedBacenta);
    };

    const handleLogMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        const newMeeting: BacentaMeeting = { ...meetingLog, id: Date.now() };
        const updatedBacenta = { ...bacenta, meetings: [newMeeting, ...bacenta.meetings] };
        setBacenta(updatedBacenta);
        onUpdateBacenta(updatedBacenta);
        // Reset form
        setMeetingLog({
            date: new Date().toISOString().split('T')[0], messageTitle: '', preacher: '',
            scripture: '', attendance: 0, offering: 0, notes: ''
        });
    };

    const generateBacentaReportText = (forWhatsApp = false) => {
        const bold = (text: string) => forWhatsApp ? `*${text}*` : text;

        let report = `${bold('Bacenta Report:')} ${bacenta.name}\n`;
        report += `${bold('Leader:')} ${leader?.name || 'N/A'}\n\n`;
        report += `--- ${bold(`MEMBERS (${members.length})`)} ---\n`;
        members.forEach(m => {
            report += `- ${m.name} (${m.phone})\n`;
        });
        report += `\n--- ${bold(`MEETING REPORTS (${bacenta.meetings.length})`)} ---\n`;
        bacenta.meetings.forEach(meet => {
            report += `\n${bold('Date:')} ${new Date(meet.date).toLocaleDateString()}\n`;
            report += `${bold('Title:')} ${meet.messageTitle} (by ${meet.preacher})\n`;
            report += `${bold('Scripture:')} ${meet.scripture}\n`;
            report += `${bold('Attendance:')} ${meet.attendance} | ${bold('Offering:')} R${meet.offering}\n`;
            report += `${bold('Notes:')} ${meet.notes || 'N/A'}\n`;
        });
        return report;
    };

    const handleDownload = () => {
        const report = generateBacentaReportText(false);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bacenta_report_${bacenta.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleShareWhatsApp = () => {
        const report = generateBacentaReportText(true);
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(report)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bacenta-details-page card">
             <div className="bacenta-header">
                <button onClick={onBack} className="back-button"><span className="material-symbols-outlined">arrow_back</span></button>
                <h2>{bacenta.name}</h2>
                <div className="header-actions">
                    <button onClick={handleShareWhatsApp} className="secondary-btn"><span className="material-symbols-outlined">share</span> Share via WhatsApp</button>
                    <button onClick={handleDownload} className="secondary-btn"><span className="material-symbols-outlined">download</span> Download Report</button>
                    <button onClick={handlePrint} className="secondary-btn"><span className="material-symbols-outlined">print</span> Print Report</button>
                </div>
            </div>
            <div className="bacenta-details-layout">
                <div className="bacenta-section">
                    <h3>Members ({members.length})</h3>
                    <div className="add-member-section">
                         <select value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)}>
                            <option value="">Add member...</option>
                            {availableMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <button onClick={handleAddMember} disabled={!memberToAdd}><span className="material-symbols-outlined">add</span></button>
                    </div>
                    <ul className="item-list" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {members.map(m => (
                            <li key={m.id}>
                                {m.name}
                                <button className="remove-btn" onClick={() => handleRemoveMember(m.id)}><span className="material-symbols-outlined">delete</span></button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bacenta-section">
                    <h3>Meeting Reports</h3>
                    <form className="log-meeting-form" onSubmit={handleLogMeeting}>
                        <h4>Log New Meeting</h4>
                        <div className="form-grid-small">
                            <input type="date" value={meetingLog.date} onChange={e => setMeetingLog(p=>({...p, date: e.target.value}))} />
                            <input type="text" placeholder="Message Title" value={meetingLog.messageTitle} onChange={e => setMeetingLog(p=>({...p, messageTitle: e.target.value}))} required/>
                            <input type="text" placeholder="Preacher" value={meetingLog.preacher} onChange={e => setMeetingLog(p=>({...p, preacher: e.target.value}))} />
                            <input type="text" placeholder="Scripture" value={meetingLog.scripture} onChange={e => setMeetingLog(p=>({...p, scripture: e.target.value}))} />
                            <input type="number" placeholder="Attendance" value={meetingLog.attendance || ''} onChange={e => setMeetingLog(p=>({...p, attendance: parseInt(e.target.value)}))} />
                            <input type="number" placeholder="Offering (R)" value={meetingLog.offering || ''} onChange={e => setMeetingLog(p=>({...p, offering: parseInt(e.target.value)}))} />
                        </div>
                        <textarea placeholder="Notes / Comments" rows={2} value={meetingLog.notes} onChange={e => setMeetingLog(p=>({...p, notes: e.target.value}))}></textarea>
                        <button type="submit" style={{alignSelf: 'center'}}>Log Meeting</button>
                    </form>
                    <div className="meeting-reports-list">
                        {bacenta.meetings.map(meet => (
                            <div key={meet.id} className="meeting-report-card">
                                <h4>{meet.messageTitle}</h4>
                                <small>{new Date(meet.date).toLocaleDateString()} | Preached by: {meet.preacher}</small>
                                <p><strong>Scripture:</strong> {meet.scripture}</p>
                                <div className="meeting-stats">
                                    <span><strong>Attendance:</strong> {meet.attendance}</span>
                                    <span><strong>Offering:</strong> R{meet.offering}</span>
                                </div>
                                {meet.notes && <p className="notes">{meet.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SchoolsManagement = ({ studentProgress, curriculum, members, onUpdateStudentProgress, onEnrollStudent }) => {
    const [view, setView] = useState('overview'); // 'overview', 'profile'
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    const handleSelectStudent = (studentId: number) => {
        setSelectedStudentId(studentId);
        setView('profile');
    };

    if (view === 'profile' && selectedStudentId) {
        const progress = studentProgress.find(p => p.studentId === selectedStudentId);
        const student = members.find(m => m.id === selectedStudentId);
        if (!progress || !student) {
            setView('overview'); // safety check
            return null;
        }
        return <StudentProfilePage 
            studentProgress={progress}
            student={student}
            curriculum={curriculum}
            members={members}
            onBack={() => setView('overview')}
            onUpdate={onUpdateStudentProgress}
        />;
    }
    
    return <SchoolsOverviewPage 
        studentProgress={studentProgress}
        members={members}
        onSelectStudent={handleSelectStudent}
        onEnrollStudent={onEnrollStudent}
    />
};

const SchoolsOverviewPage = ({ studentProgress, members, onSelectStudent, onEnrollStudent }) => {
    const [filter, setFilter] = useState({ teacherId: 'All', status: 'All' });
    const teachers = useMemo(() => {
        const teacherIds = new Set(studentProgress.map(p => p.teacherId));
        return members.filter(m => teacherIds.has(m.id));
    }, [studentProgress, members]);
    
    const filteredProgress = useMemo(() => {
        return studentProgress
            .map(p => {
                const student = members.find(m => m.id === p.studentId);
                const teacher = members.find(m => m.id === p.teacherId);
                return { ...p, student, teacher };
            })
            .filter(p => p.student && p.teacher)
            .filter(p => filter.teacherId === 'All' || p.teacherId === parseInt(filter.teacherId))
            .filter(p => filter.status === 'All' || p.status === filter.status);
    }, [studentProgress, members, filter]);
    
    const stats = useMemo(() => ({
        enrolled: studentProgress.length,
        completed: studentProgress.filter(p => p.status === 'Completed').length,
        inProgress: studentProgress.filter(p => p.status === 'In Progress').length
    }), [studentProgress]);

    return (
        <div className="card" style={{flexDirection: 'column', alignItems: 'stretch'}}>
            <div className="page-header">
                <h2>Schools Overview</h2>
            </div>

            <div className="schools-stats">
                <DashboardCard icon="school" label="Total Enrolled" value={stats.enrolled} onClick={() => setFilter(p => ({ ...p, status: 'All' }))} clickable />
                <DashboardCard icon="task_alt" label="Completed" value={stats.completed} onClick={() => setFilter(p => ({ ...p, status: 'Completed' }))} clickable />
                <DashboardCard icon="hourglass_top" label="In Progress" value={stats.inProgress} onClick={() => setFilter(p => ({ ...p, status: 'In Progress' }))} clickable />
            </div>

            <EnrollStudentSection members={members} studentProgress={studentProgress} onEnroll={onEnrollStudent} />

            <div className="schools-filters">
                <select value={filter.teacherId} onChange={e => setFilter(p => ({ ...p, teacherId: e.target.value }))}>
                    <option value="All">All Teachers</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
                    <option value="All">All Statuses</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped Out">Dropped Out</option>
                </select>
            </div>

            <div className="table-wrapper">
                <table className="student-list-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Teacher</th>
                            <th>Progress</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProgress.map(p => {
                            const progressPercent = (p.attendance.filter(a => a).length / p.attendance.length) * 100;
                            return (
                                <tr key={p.studentId} onClick={() => onSelectStudent(p.studentId)}>
                                    <td>{p.student.name}</td>
                                    <td>{p.teacher.name}</td>
                                    <td>
                                        <ProgressBar value={progressPercent} />
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${p.status.toLowerCase().replace(' ', '-')}`}>{p.status}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const EnrollStudentSection = ({ members, studentProgress, onEnroll }) => {
    const [studentId, setStudentId] = useState('');
    const [teacherId, setTeacherId] = useState('');

    const unenrolledMembers = useMemo(() => {
        const enrolledIds = new Set(studentProgress.map(p => p.studentId));
        return members.filter(m => !enrolledIds.has(m.id));
    }, [members, studentProgress]);

    const teachers = useMemo(() => {
        return members.filter(m => m.groups.includes('Bacenta Leader') || m.groups.includes('Basonta Leader') || m.memberType === 'Leader');
    }, [members]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (studentId && teacherId) {
            onEnroll(parseInt(studentId), parseInt(teacherId));
            setStudentId('');
            setTeacherId('');
        }
    };

    return (
        <div className="enroll-student-section">
            <h4>Enroll New Student</h4>
            <form onSubmit={handleSubmit}>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} required>
                    <option value="">Select a student...</option>
                    {unenrolledMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
                    <option value="">Assign a teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="submit">Enroll Student</button>
            </form>
        </div>
    );
};

const StudentProfilePage = ({ studentProgress, student, curriculum, members, onBack, onUpdate }) => {
    
    const handleAttendanceChange = (weekIndex: number, attended: boolean) => {
        const newAttendance = [...studentProgress.attendance];
        newAttendance[weekIndex] = attended;
        onUpdate({ ...studentProgress, attendance: newAttendance });
    };
    
    const handleNotesChange = (weekIndex: number, notes: string) => {
        const newNotes = [...studentProgress.notes];
        newNotes[weekIndex] = notes;
        onUpdate({ ...studentProgress, notes: newNotes });
    };

    const handleEvidenceUpload = (weekIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    const newEvidence = [...studentProgress.evidence];
                    newEvidence[weekIndex] = event.target.result;
                    onUpdate({ ...studentProgress, evidence: newEvidence });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const teacher = members.find(m => m.id === studentProgress.teacherId);
    const progressPercent = (studentProgress.attendance.filter(a => a).length / studentProgress.attendance.length) * 100;
    
    const weeklyDates = useMemo(() => {
        const startDate = new Date(student.joinDate);
        return curriculum.map((_, index) => {
            const weekDate = new Date(startDate);
            weekDate.setDate(weekDate.getDate() + index * 7);
            return weekDate.toLocaleDateString();
        });
    }, [student.joinDate, curriculum]);

    const handleDownload = () => {
        let report = `Student Progress Report\n\n`;
        report += `Student: ${student.name}\n`;
        report += `Teacher: ${teacher?.name || 'N/A'}\n`;
        report += `Status: ${studentProgress.status}\n`;
        report += `Overall Progress: ${progressPercent.toFixed(0)}%\n`;
        report += `\n--- WEEKLY BREAKDOWN ---\n`;
        
        curriculum.forEach((week, index) => {
            report += `\n---------------------------------------\n`;
            report += `Week ${week.week}: ${week.title}\n`;
            report += `Scripture: ${week.scripture}\n`;
            report += `Assumed Date: ${weeklyDates[index]}\n`;
            report += `Attendance: ${studentProgress.attendance[index] ? 'Attended' : 'Missed'}\n`;
            report += `Teacher Notes: ${studentProgress.notes[index] || 'N/A'}\n`;
            report += `Evidence: ${studentProgress.evidence[index] ? 'Uploaded' : 'None'}\n`;
        });

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_report_${student.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="student-profile-page card" style={{flexDirection: 'column', alignItems: 'stretch'}}>
            <div className="page-header">
                <button onClick={onBack} className="back-button"><span className="material-symbols-outlined">arrow_back</span> Back to Overview</button>
                <h2>Student Profile: {student.name}</h2>
                 <div className="header-actions">
                    <button onClick={handleDownload} className="secondary-btn"><span className="material-symbols-outlined">download</span> Download Report</button>
                    <button onClick={handlePrint} className="secondary-btn"><span className="material-symbols-outlined">print</span> Print Report</button>
                </div>
            </div>
            <div className="student-profile-summary">
                <p><strong>Teacher:</strong> {teacher?.name || 'N/A'}</p>
                <p><strong>Status:</strong> {studentProgress.status}</p>
                <div style={{ marginTop: '1rem' }}>
                    <ProgressBar value={progressPercent} />
                </div>
            </div>

            <div className="weekly-progress-list">
                {curriculum.map((week, index) => (
                    <div key={week.week} className="week-card">
                        <div className="week-card-header">
                            <h3>Week {week.week}: {week.title}</h3>
                            <small>{week.scripture}</small>
                            <span className="attendance-print-only"><strong>Date:</strong> {weeklyDates[index]}</span>
                        </div>
                        <div className="week-card-content">
                            <div className="week-controls">
                                 <div className="group-checklist-item">
                                    <input 
                                        type="checkbox" 
                                        id={`week-${week.week}-attended`} 
                                        checked={studentProgress.attendance[index]} 
                                        onChange={(e) => handleAttendanceChange(index, e.target.checked)}
                                    />
                                    <label htmlFor={`week-${week.week}-attended`}>Attended</label>
                                    <span className="attendance-print-only">
                                        <strong>Attendance:</strong> {studentProgress.attendance[index] ? 'Attended' : 'Missed'}
                                    </span>
                                </div>
                                <textarea
                                    placeholder="Teacher notes..."
                                    rows={3}
                                    value={studentProgress.notes[index] || ''}
                                    onChange={(e) => handleNotesChange(index, e.target.value)}
                                ></textarea>
                                <p className="notes-print-only"><strong>Notes:</strong> {studentProgress.notes[index] || 'N/A'}</p>
                            </div>
                            <div className="evidence-section">
                                <h4>Picture Evidence</h4>
                                <div className="evidence-gallery">
                                    {studentProgress.evidence[index] ? (
                                        <div className="evidence-item">
                                            <img src={studentProgress.evidence[index] as string} alt={`Evidence for week ${week.week}`} />
                                        </div>
                                    ) : <p>No evidence uploaded.</p>}
                                </div>
                                <input 
                                    type="file" 
                                    id={`evidence-upload-${week.week}`}
                                    accept="image/*" 
                                    style={{display: 'none'}}
                                    onChange={(e) => handleEvidenceUpload(index, e)}
                                />
                                <label htmlFor={`evidence-upload-${week.week}`} className="evidence-uploader">
                                     <span className="material-symbols-outlined">upload</span> Upload Photo
                                </label>
                                <p className="notes-print-only"><strong>Evidence:</strong> {studentProgress.evidence[index] ? 'Uploaded' : 'None'}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProgressBar = ({ value }) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    return (
        <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${clampedValue}%` }}></div>
            <span className="progress-bar-text">{clampedValue.toFixed(0)}%</span>
        </div>
    );
};

const VisitationManagement = ({ visitations, members, bacentas, onUpdateVisitation }) => {
    const [view, setView] = useState('list'); // 'list', 'details'
    const [selectedVisit, setSelectedVisit] = useState<Visitation | null>(null);

    const handleSelectVisit = (visit: Visitation) => {
        setSelectedVisit(visit);
        setView('details');
    };

    const handleUpdateAndGoBack = (updatedVisit: Visitation) => {
        onUpdateVisitation(updatedVisit);
        // Optimistically update the selected visit to reflect changes immediately
        setSelectedVisit(updatedVisit);
    };


    if (view === 'details' && selectedVisit) {
        return <VisitDetailsPage
            visit={selectedVisit}
            members={members}
            onBack={() => setView('list')}
            onUpdate={handleUpdateAndGoBack}
        />;
    }

    return <VisitationListPage
        visitations={visitations}
        members={members}
        bacentas={bacentas}
        onSelectVisit={handleSelectVisit}
    />;
};

const VisitationListPage = ({ visitations, members, bacentas, onSelectVisit }) => {
    const [filter, setFilter] = useState({ status: 'All', leaderId: 'All', bacentaId: 'All', dateRange: 'This Week' });

    const leaders = useMemo(() => {
        const leaderIds = new Set(visitations.map(v => v.assignedLeaderId));
        return members.filter(m => leaderIds.has(m.id));
    }, [visitations, members]);

    const filteredVisitations = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        const statusOrder = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };

        return visitations
            .filter(v => filter.status === 'All' || v.status === filter.status)
            .filter(v => filter.leaderId === 'All' || v.assignedLeaderId === parseInt(filter.leaderId))
            .filter(v => {
                 if (filter.bacentaId === 'All') return true;
                 const member = members.find(m => m.id === v.memberId);
                 if (!member) return false;
                 return bacentas.some(b => b.id === parseInt(filter.bacentaId) && b.memberIds.includes(member.id));
            })
            .filter(v => {
                if (filter.dateRange === 'All') return true;
                const visitDate = new Date(v.creationDate);
                if (filter.dateRange === 'This Week') {
                    return visitDate >= startOfWeek;
                }
                if (filter.dateRange === 'This Month') {
                    return visitDate >= startOfMonth;
                }
                return true;
            })
            .map(v => ({
                ...v,
                member: members.find(m => m.id === v.memberId),
                leader: members.find(m => m.id === v.assignedLeaderId),
            }))
            .filter(v => v.member && v.leader)
            .sort((a, b) => {
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
            });
    }, [visitations, members, bacentas, filter]);
    
     const weeklyStats = useMemo(() => {
        const thisWeeksVisits = filteredVisitations.filter(v => filter.dateRange === 'This Week');
        const completed = thisWeeksVisits.filter(v => v.status === 'Completed').length;
        const pending = thisWeeksVisits.filter(v => v.status === 'Pending' || v.status === 'In Progress').length;
        const activeLeaders = new Set(thisWeeksVisits.map(v => v.assignedLeaderId)).size;
        return { total: thisWeeksVisits.length, completed, pending, activeLeaders };
    }, [filteredVisitations, filter.dateRange]);


    const generateReportText = () => {
        let text = `*Visitation Report (${filter.dateRange})*\n`;
        text += `_Filters: Status(${filter.status}), Leader(${filter.leaderId === 'All' ? 'All' : leaders.find(l => l.id === parseInt(filter.leaderId))?.name})_\n\n`;

        filteredVisitations.forEach(visit => {
            text += `*${visit.member.name}* (${visit.priority})\n`;
            text += `  - Reason: ${visit.reason}\n`;
            text += `  - Assigned: ${visit.leader.name}\n`;
            text += `  - Status: *${visit.status}*\n`;
            text += `  - Address: ${visit.member.address || 'N/A'}\n\n`;
        });
        return text;
    };

    const handleSendWhatsApp = () => {
        const text = generateReportText();
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const handleDownloadReport = () => {
        const text = generateReportText().replace(/\*/g, ''); // Remove markdown for plain text
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitation_report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="card" style={{flexDirection: 'column', alignItems: 'stretch'}}>
            <div className="page-header">
                <h2>Visitation List</h2>
                <div className="header-actions">
                    <button onClick={handleSendWhatsApp} className="secondary-btn"><span className="material-symbols-outlined">share</span> Send via WhatsApp</button>
                    <button onClick={handleDownloadReport} className="secondary-btn"><span className="material-symbols-outlined">download</span> Download Report</button>
                </div>
            </div>
             {/* FIX: Add missing onClick prop to DashboardCard components to satisfy type requirements. These cards are for display only. */}
             <div className="visitation-summary-cards">
                <DashboardCard icon="event_upcoming" label="Total (This Week)" value={weeklyStats.total} onClick={() => {}} />
                <DashboardCard icon="task_alt" label="Completed" value={weeklyStats.completed} onClick={() => {}} />
                <DashboardCard icon="pending" label="Pending" value={weeklyStats.pending} onClick={() => {}} />
                <DashboardCard icon="military_tech" label="Active Leaders" value={weeklyStats.activeLeaders} onClick={() => {}} />
            </div>
            <div className="visitation-filters">
                <select value={filter.status} onChange={e => setFilter(p => ({...p, status: e.target.value}))}>
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
                <select value={filter.leaderId} onChange={e => setFilter(p => ({...p, leaderId: e.target.value}))}>
                    <option value="All">All Leaders</option>
                    {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                 <select value={filter.bacentaId} onChange={e => setFilter(p => ({...p, bacentaId: e.target.value}))}>
                    <option value="All">All Bacentas</option>
                    {bacentas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                 <select value={filter.dateRange} onChange={e => setFilter(p => ({...p, dateRange: e.target.value}))}>
                    <option value="All">All Time</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                </select>
            </div>
            <div className="visitations-grid">
                {filteredVisitations.map(visit => (
                    <div key={visit.id} className="visit-card" onClick={() => onSelectVisit(visit)}>
                        <div className="visit-card-header">
                            <h4>{visit.member.name}</h4>
                            <span className={`priority-tag priority-${visit.priority.toLowerCase()}`}>{visit.priority}</span>
                        </div>
                        <div className="visit-card-body">
                            <p><strong>Reason:</strong> {visit.reason}</p>
                            <p><strong>Assigned To:</strong> {visit.leader.name}</p>
                            <p><small>Created: {new Date(visit.creationDate).toLocaleDateString()}</small></p>
                        </div>
                        <div className="visit-card-footer">
                             <span className={`status-badge status-${visit.status.toLowerCase().replace(' ', '-')}`}>{visit.status}</span>
                        </div>
                    </div>
                ))}
                 {filteredVisitations.length === 0 && <p style={{width: '100%', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1'}}>No visitations match the current filters.</p>}
            </div>
        </div>
    );
};


const VisitDetailsPage = ({ visit, members, onBack, onUpdate }) => {
    const [currentVisit, setCurrentVisit] = useState(visit);
    const [reportData, setReportData] = useState<VisitReport>(
        currentVisit.report || {
            visitDate: new Date().toISOString().split('T')[0],
            visitedBy: members.find(m => m.id === currentVisit.assignedLeaderId)?.name || '',
            metWith: '',
            notes: '',
            followUpActions: '',
            evidencePhoto: null,
        }
    );

    const member = members.find(m => m.id === currentVisit.memberId);
    
    const allLeaders = useMemo(() => {
        return members.filter(m => m.memberType === 'Leader' || m.groups.includes('Bacenta Leader'));
    }, [members]);
    
    const generateSingleReport = (forWhatsApp = false) => {
        const report = currentVisit.report;
        let text = `*Visitation Report for ${member.name}*\n\n`;
        text += `*Reason:* ${currentVisit.reason}\n`;
        text += `*Assigned to:* ${members.find(m => m.id === currentVisit.assignedLeaderId)?.name || 'N/A'}\n`;
        text += `*Status:* ${currentVisit.status}\n`;
        text += `*Address:* ${member.address || 'N/A'}\n`;
        if (forWhatsApp && member.address) {
            text += `*Open in Maps:* https://www.google.com/maps?q=${encodeURIComponent(member.address)}\n`;
        }
        text += `\n--- *Visit Details* ---\n`;
        if (report) {
            text += `*Date of Visit:* ${new Date(report.visitDate).toLocaleDateString()}\n`;
            text += `*Visited By:* ${report.visitedBy}\n`;
            text += `*Met With:* ${report.metWith}\n`;
            text += `*Notes:* ${report.notes}\n`;
            text += `*Follow-up:* ${report.followUpActions}\n`;
            text += `*Evidence:* ${report.evidencePhoto ? 'Photo attached' : 'None'}\n`;
        } else {
            text += `_No report has been filed for this visit yet._\n`;
        }
        return text;
    };
    
    const handleShare = () => {
        const text = generateSingleReport(true);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };
    
    const handleDownload = () => {
        const text = generateSingleReport().replace(/\*/g, '');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visit_report_${member.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => window.print();

    const handleStatusChange = (newStatus: Visitation['status']) => {
        const updatedVisit = { ...currentVisit, status: newStatus };
        setCurrentVisit(updatedVisit);
        onUpdate(updatedVisit);
    };
    
    const handleLeaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLeaderId = parseInt(e.target.value);
        const updatedVisit = { ...currentVisit, assignedLeaderId: newLeaderId };
        setCurrentVisit(updatedVisit);
        onUpdate(updatedVisit);
    };

    const handleReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    setReportData(prev => ({...prev, evidencePhoto: result}));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSaveReport = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedVisit = { ...currentVisit, report: reportData };
        if(updatedVisit.status !== 'Completed') {
            updatedVisit.status = 'Completed';
        }
        setCurrentVisit(updatedVisit);
        onUpdate(updatedVisit);
    };

    if (!member) return <div>Loading...</div>;

    return (
        <div className="card visit-details-page" style={{flexDirection: 'column', alignItems: 'stretch'}}>
            <div className="page-header">
                <button onClick={onBack} className="back-button"><span className="material-symbols-outlined">arrow_back</span> Back to List</button>
                <h2>Visit Details</h2>
                 <div className="header-actions">
                    <button onClick={handleShare} className="secondary-btn" title="Share via WhatsApp"><span className="material-symbols-outlined">share</span></button>
                    <button onClick={handleDownload} className="secondary-btn" title="Download Report"><span className="material-symbols-outlined">download</span></button>
                    <button onClick={handlePrint} className="secondary-btn" title="Print Report"><span className="material-symbols-outlined">print</span></button>
                </div>
            </div>

            <div className="visit-details-layout">
                <div className="visit-info-section">
                    <h3>Member to Visit</h3>
                    <div className="info-card">
                        <h4>{member.name}</h4>
                        <p><span className="material-symbols-outlined">call</span> {member.phone}</p>
                        <p><span className="material-symbols-outlined">email</span> {member.email}</p>
                        <div className="address-line">
                            <p><span className="material-symbols-outlined">home</span> {member.address || 'No address on file.'}</p>
                            {member.address && (
                                <a href={`https://www.google.com/maps?q=${encodeURIComponent(member.address)}`} target="_blank" rel="noopener noreferrer" className="map-link">
                                    <span className="material-symbols-outlined">map</span> Open in Maps
                                </a>
                            )}
                        </div>
                        <p><strong>Reason for Visit:</strong> {currentVisit.reason}</p>
                        {currentVisit.notes && <p className="notes">{currentVisit.notes}</p>}
                    </div>

                    <h3>Visit Assignment</h3>
                     <div className="info-card">
                         <div className="form-group">
                            <label><strong>Assigned Leader:</strong></label>
                            <select value={currentVisit.assignedLeaderId} onChange={handleLeaderChange}>
                                {allLeaders.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label><strong>Visit Status:</strong></label>
                            <select value={currentVisit.status} onChange={e => handleStatusChange(e.target.value as Visitation['status'])}>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="visit-report-section">
                    <h3>Visit Report</h3>
                    <form className="visit-report-form" onSubmit={handleSaveReport}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Date of Visit</label>
                                <input type="date" name="visitDate" value={reportData.visitDate} onChange={handleReportChange} required />
                            </div>
                             <div className="form-group">
                                <label>Visitor(s) Name(s)</label>
                                <input type="text" name="visitedBy" value={reportData.visitedBy} onChange={handleReportChange} required />
                            </div>
                             <div className="form-group" style={{gridColumn: '1 / -1'}}>
                                <label>Who They Met</label>
                                <input type="text" name="metWith" value={reportData.metWith} onChange={handleReportChange} placeholder="e.g., Member, spouse, guardian" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Notes (Spiritual state, needs, recommendations)</label>
                            <textarea name="notes" rows={5} value={reportData.notes} onChange={handleReportChange} required></textarea>
                        </div>
                        <div className="form-group">
                            <label>Follow-up Actions</label>
                            <textarea name="followUpActions" rows={3} value={reportData.followUpActions} onChange={handleReportChange} placeholder="e.g., Prayer, connect to Bacenta, enroll in schools" required></textarea>
                        </div>
                        <div className="form-group">
                            <label>Picture Evidence (Optional)</label>
                             <div className="evidence-section" style={{alignItems: 'flex-start'}}>
                                <div className="evidence-gallery">
                                     {reportData.evidencePhoto && (
                                        <div className="evidence-item">
                                            <img src={reportData.evidencePhoto} alt="Visit evidence" />
                                        </div>
                                    )}
                                </div>
                                <input type="file" id="visit-photo" accept="image/*" onChange={handlePhotoUpload} style={{display: 'none'}}/>
                                <label htmlFor="visit-photo" className="evidence-uploader">
                                     <span className="material-symbols-outlined">upload</span> Upload Photo
                                </label>
                            </div>
                        </div>
                        <button type="submit">Save Report</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const WeekSelector = ({ selectedWeek, setSelectedWeek }) => {
    const handlePrevWeek = () => {
        if (selectedWeek.week > 1) {
            setSelectedWeek({ ...selectedWeek, week: selectedWeek.week - 1 });
        } else {
            setSelectedWeek({ year: selectedWeek.year - 1, week: 52 });
        }
    };
    const handleNextWeek = () => {
        if (selectedWeek.week < 52) {
            setSelectedWeek({ ...selectedWeek, week: selectedWeek.week + 1 });
        } else {
            setSelectedWeek({ year: selectedWeek.year + 1, week: 1 });
        }
    };

    return (
        <div className="week-selector">
            <button onClick={handlePrevWeek} title="Previous Week"><span className="material-symbols-outlined">chevron_left</span></button>
            <div className="week-display">
                <span>{selectedWeek.year} - Week {selectedWeek.week}</span>
            </div>
            <button onClick={handleNextWeek} title="Next Week"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
    );
};

const LeadershipBoard = ({ members, allLeaderStats, visitations, bacentas, studentProgress, allAttendance, onEditStats, onEditMember }) => {
    const [sortKey, setSortKey] = useState('overallScore');
    const [selectedWeek, setSelectedWeek] = useState(() => {
        const current = getCurrentWeek();
        // Default to a week with data for demonstration purposes
        return { year: 2024, week: 30 };
    });

    const leaderProfiles = useMemo(() => {
        const leaders = members.filter(m => m.memberType === 'Leader' || m.groups.includes('Bacenta Leader'));
        
        return leaders.map(leader => {
            const weeklyStats = allLeaderStats.find(s => s.leaderId === leader.id && s.year === selectedWeek.year && s.week === selectedWeek.week);
            const visitsCompleted = visitations.filter(v => v.assignedLeaderId === leader.id && v.status === 'Completed').length;
            
            const servicesAttended = Object.values(allAttendance).filter((record: ServiceAttendanceRecord) => record.presentMemberIds.includes(leader.id)).length;
            
            const bacentaSessions = bacentas.reduce((count, bacenta) => {
                return count + bacenta.meetings.filter(meeting => meeting.preacher === leader.name).length;
            }, 0);

            const schoolSessions = studentProgress.filter(p => p.teacherId === leader.id).reduce((count, p) => {
                return count + p.attendance.filter(attended => attended).length;
            }, 0);
            
            const bacentaSessionsTaught = bacentaSessions + schoolSessions;

            const prayerHours = weeklyStats?.prayerHours || 0;
            const quietTimeStreak = weeklyStats?.quietTimeStreak || 0;
            const readingProgress = weeklyStats?.readingProgress || { book: "N/A", chaptersRead: 0, totalChapters: 1 };
            const readingPercentage = readingProgress.totalChapters > 0 ? (readingProgress.chaptersRead / readingProgress.totalChapters) * 100 : 0;
            
            // Gamification Score
            const overallScore =
                (visitsCompleted * 10) +
                (prayerHours * 5) +
                (servicesAttended * 3) +
                (bacentaSessionsTaught * 15) +
                (quietTimeStreak * 2) +
                (readingPercentage * 0.5);

            let level = "Faithful Steward";
            let levelClass = "bronze";
            if (overallScore > 200) { level = "Lead Shepherd"; levelClass = "gold"; }
            else if (overallScore > 100) { level = "Devoted Shepherd"; levelClass = "silver"; }
            
            const badges = [];
            if(prayerHours >= 40) badges.push({icon: 'local_fire_department', text: 'Prayer Warrior', class: 'badge-danger'});
            if(quietTimeStreak >= 30) badges.push({icon: 'workspace_premium', text: 'Consistency King', class: 'badge-warning'});


            return {
                ...leader,
                weeklyStats,
                visitsCompleted,
                servicesAttended,
                bacentaSessionsTaught,
                prayerHours,
                quietTimeStreak,
                readingProgress,
                readingPercentage,
                overallScore: Math.round(overallScore),
                level,
                levelClass,
                badges
            };
        }).sort((a, b) => b[sortKey] - a[sortKey]);

    }, [members, allLeaderStats, visitations, bacentas, studentProgress, allAttendance, sortKey, selectedWeek]);

    const generateReportText = () => {
        let text = `*Leadership Board Report - ${selectedWeek.year} Week ${selectedWeek.week}*\n`;
        text += `_Sorted by: ${sortKey}_\n\n`;

        leaderProfiles.forEach((leader, index) => {
            text += `*${index + 1}. ${leader.name}* (${leader.overallScore} pts)\n`;
            text += `  - Prayer: ${leader.prayerHours} hrs\n`;
            text += `  - Q.T. Streak: ${leader.quietTimeStreak} days\n`;
            text += `  - Visits: ${leader.visitsCompleted}\n`;
            text += `  - Attendance: ${leader.servicesAttended}\n\n`;
        });
        return text;
    };

    const handleSendWhatsApp = () => {
        const text = generateReportText();
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const handleDownloadReport = () => {
        const text = generateReportText().replace(/\*/g, ''); // Remove markdown for plain text
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leadership_report_${selectedWeek.year}_W${selectedWeek.week}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="leadership-board-container card">
            <div className="page-header">
                <h2>Leadership Board</h2>
                 <WeekSelector selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} />
                <div className="leaderboard-controls">
                    <div className="header-actions">
                         <button onClick={handleSendWhatsApp} className="secondary-btn" title="Share via WhatsApp"><span className="material-symbols-outlined">share</span></button>
                         <button onClick={handleDownloadReport} className="secondary-btn" title="Download Report"><span className="material-symbols-outlined">download</span></button>
                    </div>
                    <select id="sort-leaders" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                        <option value="overallScore">Overall Score</option>
                        <option value="visitsCompleted">Visits Completed</option>
                        <option value="prayerHours">Prayer Hours</option>
                        <option value="bacentaSessionsTaught">Sessions Taught</option>
                        <option value="servicesAttended">Service Attendance</option>
                        <option value="quietTimeStreak">Quiet Time Streak</option>
                    </select>
                </div>
            </div>
            
            <div className="leaderboard-grid">
                {leaderProfiles.map(leader => (
                    <div key={leader.id} className="leader-card">
                        <div className="leader-card-header">
                            <img src={leader.photoUrl || 'https://i.imgur.com/8aRPATH.png'} alt={leader.name} className="leader-photo" />
                            <div className="leader-info">
                                <h3>{leader.name}</h3>
                                <span className={`level-badge level-${leader.levelClass}`}>{leader.level}</span>
                            </div>
                            <div className="leader-score">
                                {leader.overallScore}
                                <span>SCORE</span>
                            </div>
                        </div>
                        {leader.badges.length > 0 && (
                           <div className="leader-badges">
                                {leader.badges.map(badge => (
                                    <span key={badge.text} className={`stat-badge ${badge.class}`} title={badge.text}>
                                        <span className="material-symbols-outlined">{badge.icon}</span> {badge.text}
                                    </span>
                                ))}
                           </div>
                        )}
                        <div className="leader-stats-grid">
                            <div className="stat-item" title="Total Visits Completed">
                                <span className="material-symbols-outlined">real_estate_agent</span>
                                <strong>{leader.visitsCompleted}</strong>
                                <small>Visits Done</small>
                            </div>
                             <div className="stat-item editable" onClick={() => onEditStats(leader, leader.weeklyStats, selectedWeek)} title="Click to edit weekly stats">
                                <span className="material-symbols-outlined">volunteer_activism</span>
                                <strong>{leader.prayerHours}</strong>
                                <small>Prayer Hours</small>
                            </div>
                             <div className="stat-item" title="Total Sessions Taught (Bacenta + School)">
                                <span className="material-symbols-outlined">church</span>
                                <strong>{leader.bacentaSessionsTaught}</strong>
                                <small>Sessions Taught</small>
                            </div>
                             <div className="stat-item" title="Total Services Attended">
                                <span className="material-symbols-outlined">checklist</span>
                                <strong>{leader.servicesAttended}</strong>
                                <small>Services Attended</small>
                            </div>
                            <div className="stat-item editable" onClick={() => onEditStats(leader, leader.weeklyStats, selectedWeek)} title="Click to edit weekly stats">
                                <span className="material-symbols-outlined">self_improvement</span>
                                <strong>{leader.quietTimeStreak}</strong>
                                <small>QT Streak</small>
                            </div>
                        </div>
                        <div className="reading-progress-section editable" onClick={() => onEditStats(leader, leader.weeklyStats, selectedWeek)} title="Click to edit weekly stats">
                            <small>{leader.readingProgress?.book || 'No Book Assigned'}</small>
                            <ProgressBar value={leader.readingPercentage} />
                        </div>
                        <div className="leader-card-actions">
                            <button onClick={() => onEditMember(leader)} className="edit-profile-btn">
                                <span className="material-symbols-outlined">edit</span> Edit Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LeaderStatsEditModal = ({ data, onClose, onSave }) => {
    const { leader, weeklyStats, week } = data;
    
    const [formData, setFormData] = useState({
        prayerHours: weeklyStats?.prayerHours || 0,
        quietTimeStreak: weeklyStats?.quietTimeStreak || 0,
        book: weeklyStats?.readingProgress?.book || 'Genesis',
        chaptersRead: weeklyStats?.readingProgress?.chaptersRead || 0,
    });

    const totalChapters = BIBLE_BOOKS[formData.book] || 1;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'book') {
            setFormData(prev => ({ ...prev, book: value, chaptersRead: 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalStats: WeeklyLeaderStats = {
            leaderId: leader.id,
            year: week.year,
            week: week.week,
            prayerHours: formData.prayerHours,
            quietTimeStreak: formData.quietTimeStreak,
            readingProgress: {
                book: formData.book,
                chaptersRead: formData.chaptersRead,
                totalChapters: totalChapters,
            },
        };
        onSave(finalStats);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-content" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
                <div className="modal-header">
                    <h2>Edit Stats: {leader.name}</h2>
                    <button type="button" onClick={onClose} className="close-button"><span className="material-symbols-outlined">close</span></button>
                </div>
                 <div className="modal-body">
                    <p>Updating stats for <strong>{week.year} - Week {week.week}</strong></p>
                    <div className="form-grid">
                         <div className="form-group">
                            <label htmlFor="prayerHours">Prayer Hours</label>
                            <input type="number" id="prayerHours" name="prayerHours" value={formData.prayerHours} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="quietTimeStreak">Quiet Time Streak (days)</label>
                            <input type="number" id="quietTimeStreak" name="quietTimeStreak" value={formData.quietTimeStreak} onChange={handleChange} min="0" />
                        </div>
                    </div>
                    <h4>Bible Reading Progress</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="book">Book</label>
                            <select id="book" name="book" value={formData.book} onChange={handleChange}>
                                {Object.keys(BIBLE_BOOKS).map(bookName => (
                                    <option key={bookName} value={bookName}>{bookName}</option>
                                ))}
                            </select>
                        </div>
                         <div className="form-group">
                            <label htmlFor="chaptersRead">Chapters Read (of {totalChapters})</label>
                            <input type="number" id="chaptersRead" name="chaptersRead" value={formData.chaptersRead} onChange={handleChange} min="0" max={totalChapters} />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button type="submit">Save Changes</button>
                </div>
            </form>
        </div>
    );
};


const root = createRoot(document.getElementById("root"));
root.render(<App />);