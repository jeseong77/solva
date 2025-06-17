import ProblemEdit from "@/components/problem/ProblemEdit";

/**
 * 새로운 문제를 생성하는 페이지입니다.
 * ProblemEdit 컴포넌트를 렌더링하며, problemId가 없는 경우
 * ProblemEdit 컴포넌트 내부에서 '생성 모드'로 동작하게 됩니다.
 */
export default function CreateProblemPage() {
  return <ProblemEdit />;
}
