// src/pages/MemberManagement.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    title: '',
    email: '',
    photoUrl: '',
    order: 0
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        order: doc.data().order || 0 // 순서가 없는 경우 0으로 설정
      }));
      // 순서대로 정렬
      const sortedMembers = membersData.sort((a, b) => a.order - b.order);
      setMembers(sortedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      position: member.position,
      title: member.title,
      email: member.email,
      photoUrl: member.photoUrl,
      order: member.order || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (member) => {
    if (window.confirm('이 구성원을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'members', member.id));
        if (member.photoUrl) {
          const imageRef = ref(storage, member.photoUrl);
          await deleteObject(imageRef).catch((error) => {
            console.log("기존 이미지 삭제 실패:", error);
          });
        }
        fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = formData.photoUrl;
      if (selectedFile) {
        const storageRef = ref(storage, `members/${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const memberData = {
        name: formData.name,
        position: formData.position,
        title: formData.title,
        email: formData.email,
        photoUrl: photoUrl,
        order: parseInt(formData.order) // 순서를 숫자로 확실하게 변환
      };

      if (selectedMember) {
        await updateDoc(doc(db, 'members', selectedMember.id), memberData);
      } else {
        await addDoc(collection(db, 'members'), memberData);
      }
      
      setIsModalOpen(false);
      setSelectedMember(null);
      setFormData({
        name: '',
        position: '',
        title: '',
        email: '',
        photoUrl: '',
        order: 0
      });
      setSelectedFile(null);
      await fetchMembers(); // 데이터를 다시 불러와 화면 갱신
    } catch (error) {
      console.error('Error saving member:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">구성원 관리</h2>
        <button
          onClick={() => {
            setSelectedMember(null);
            setFormData({
              name: '',
              position: '',
              title: '',
              email: '',
              photoUrl: '',
              order: 0
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          구성원 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="border rounded-lg p-4 shadow-sm">
            <div className="relative">
              <img
                src={member.photoUrl || '/placeholder-profile.png'}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
              />
              <div className="absolute top-0 right-0 flex space-x-1">
                <button
                  onClick={() => handleEdit(member)}
                  className="text-blue-600 hover:text-blue-800 bg-white rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  className="text-red-600 hover:text-red-800 bg-white rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center">{member.name}</h3>
            <p className="text-gray-600 text-center">{member.position}</p>
            <p className="text-gray-600 text-center">{member.title}</p>
            <p className="text-gray-600 text-center">{member.email}</p>
            <p className="text-gray-500 text-center text-sm">순서: {member.order}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {selectedMember ? '구성원 정보 수정' : '구성원 추가'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">순서</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직책</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직위</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">프로필 이미지</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedMember(null);
                    setFormData({
                      name: '',
                      position: '',
                      title: '',
                      email: '',
                      photoUrl: '',
                      order: 0
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
                  {selectedMember ? '수정' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}