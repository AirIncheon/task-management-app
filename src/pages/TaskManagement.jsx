// src/pages/TaskManagement.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [formData, setFormData] = useState({
    memberId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    title: '',
    content: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, []);

  const fetchTasks = async () => {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    const tasksData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setTasks(tasksData);
  };

  const fetchMembers = async () => {
    const querySnapshot = await getDocs(collection(db, 'members'));
    const membersData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // 순서대로 정렬
    const sortedMembers = membersData.sort((a, b) => (a.order || 0) - (b.order || 0));
    setMembers(sortedMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTask) {
        await updateDoc(doc(db, 'tasks', selectedTask.id), formData);
      } else {
        await addDoc(collection(db, 'tasks'), formData);
      }
      setIsModalOpen(false);
      setSelectedTask(null);
      setFormData({
        memberId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        title: '',
        content: '',
        color: '#3B82F6'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('이 업무를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      memberId: task.memberId,
      startDate: task.startDate,
      endDate: task.endDate || '',
      title: task.title,
      content: task.content,
      color: task.color
    });
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    const member = members.find(m => m.id === task.memberId);
    const searchString = `${task.title} ${task.content} ${member?.name || ''} ${task.startDate} ${task.endDate || ''}`.toLowerCase();
    
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesMember = selectedMemberId === 'all' || task.memberId === selectedMemberId;
    
    return matchesSearch && matchesMember;
  });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">업무 관리</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          업무 추가
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="제목, 내용, 작성자, 날짜로 검색..."
          className="w-full p-2 border rounded mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedMemberId('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedMemberId === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체 업무
          </button>
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedMemberId === member.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map(task => {
          const member = members.find(m => m.id === task.memberId);
          return (
            <div
              key={task.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderLeftColor: task.color, borderLeftWidth: '4px' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-gray-600">{member?.name}</p>
                  <p className="text-sm text-gray-500">
                    {task.startDate} ~ {task.endDate || '진행중'}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{task.content}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {selectedTask ? '업무 수정' : '업무 추가'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">담당자</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    required
                  >
                    <option value="">담당자 선택</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">시작일</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    min="2024-12-29"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">완료일</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">제목</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded mb-2"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <label className="block text-sm font-medium text-gray-700 mt-2">색상</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['#4F46E5', '#2563EB', '#0EA5E9', '#06B6D4', '#10B981', '#84CC16', '#EAB308', '#F97316', '#DC2626'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-600' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">내용</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="4"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedTask(null);
                    setFormData({
                      memberId: '',
                      startDate: format(new Date(), 'yyyy-MM-dd'),
                      endDate: '',
                      title: '',
                      content: '',
                      color: '#3B82F6'
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {selectedTask ? '수정' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}