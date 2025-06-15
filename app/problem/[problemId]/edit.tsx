import ProblemEdit from "@/components/problem/ProblemEdit";

/**
 * 기존 문제를 수정하는 페이지입니다.
 * ProblemEdit 컴포넌트를 렌더링하며,
 * ProblemEdit 컴포넌트 내부에서 URL의 [problemId]를 파라미터로 받아
 * '수정 모드'로 동작하게 됩니다.
 */
export default function EditProblemPage() {
  return <ProblemEdit />;
}
