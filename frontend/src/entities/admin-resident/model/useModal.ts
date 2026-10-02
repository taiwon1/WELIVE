import { useState } from 'react';

export function useModal<T extends string>() {
  const [openModal, setOpenModal] = useState<T | null>(null);
  const handleModalOpen = (type: T) => () => setOpenModal(type);
  const handleModalClose = () => setOpenModal(null);
  return { openModal, handleModalOpen, handleModalClose };
}
