"use client";

import DeleteCourseModal from "./DeleteCourseModal";

export interface DeleteLearningPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  pathTitle: string;
  pathId: string;
  isDeleting: boolean;
}

/**
 * DeleteLearningPathModal
 * Consolidated wrapper around DeleteCourseModal providing single-click permanent deletion
 * while maintaining backward compatibility with all explore / dashboard callers.
 */
export default function DeleteLearningPathModal({
  isOpen,
  onClose,
  onConfirm,
  pathTitle,
  pathId,
  isDeleting,
}: DeleteLearningPathModalProps) {
  return (
    <DeleteCourseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      courseTitle={pathTitle}
      courseId={pathId}
      isDeleting={isDeleting}
      requireTitleMatch={false}
      title="Delete Learning Path?"
      subtitle="Permanent removal of learning path and all linked assets"
      confirmButtonText="Delete Permanently"
      showWarningCallout={false}
    />
  );
}
