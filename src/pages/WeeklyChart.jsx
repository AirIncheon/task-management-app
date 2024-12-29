// src/pages/WeeklyChart.jsx
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function WeeklyChart() {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [tooltipContent, setTooltipContent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersSnapshot, tasksSnapshot] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'tasks'))
      ]);

      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const sortedMembers = membersData.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMembers(sortedMembers);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 0 })
  });

  const getTasksForMemberAndDay = (memberId, date) => {
    return tasks.filter(task => {
      if (task.memberId !== memberId) return false;
      
      const taskStart = parseISO(task.startDate);
      const taskEnd = task.endDate ? parseISO(task.endDate) : new Date();
      
      return isWithinInterval(date, { start: taskStart, end: taskEnd });
    });
  };

  const checkTaskStatus = (task) => {
    if (!task.endDate) return false;
    const endDate = parseISO(task.endDate);
    const today = new Date();
    return endDate < today;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))}
            className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            ← 이전 주
          </button>
          <span className="font-medium text-sm">
            {format(weekStart, 'yyyy.MM.dd', { locale: ko })} - 
            {format(endOfWeek(weekStart, { weekStartsOn: 0 }), ' MM.dd', { locale: ko })}
          </span>
          <button
            onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)))}
            className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            다음 주 →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
              <col className="w-[12.5%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-r p-2 text-center">구성원</th>
                {weekDays.map(day => (
                  <th key={day.toISOString()} className="border-b p-2 text-center">
                    <div className="text-sm">{format(day, 'EEE', { locale: ko })}</div>
                    <div className="text-xs text-gray-500">{format(day, 'MM.dd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="border-r p-2 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                  </td>
                  {weekDays.map(day => (
                    <td key={`${member.id}-${day.toISOString()}`} className="border-t p-1">
                      <div className="min-h-[48px] space-y-1">
                        {getTasksForMemberAndDay(member.id, day).map(task => (
                          <div
                            key={task.id}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipContent({
                                content: task,
                                position: {
                                  top: rect.top + window.scrollY,
                                  left: rect.left + window.scrollX,
                                  width: rect.width
                                }
                              });
                            }}
                            onMouseLeave={() => setTooltipContent(null)}
                            className={`text-xs p-1 rounded shadow-sm overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer transition-opacity`}
                            style={{ 
                              backgroundColor: checkTaskStatus(task) ? '#E5E7EB' : task.color,
                              color: checkTaskStatus(task) ? '#4B5563' : '#FFFFFF'
                            }}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tooltipContent && (
        <div
          className="fixed bg-white shadow-lg rounded p-3 z-50 max-w-xs"
          style={{
            top: tooltipContent.position.top - 10 + 'px',
            left: tooltipContent.position.left + 'px'
          }}
        >
          <h4 className="font-medium mb-1">{tooltipContent.content.title}</h4>
          <p className="text-sm text-gray-600 mb-1">
            {tooltipContent.content.startDate} ~ {tooltipContent.content.endDate || '진행중'}
          </p>
          <p className="text-sm whitespace-pre-wrap">{tooltipContent.content.content}</p>
        </div>
      )}
    </div>
  );
}