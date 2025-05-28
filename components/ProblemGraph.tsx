import React, { JSX } from "react"; // React import는 필요합니다.
import { View } from "react-native";
import Svg, { G, Circle, Text as SvgText, Path } from "react-native-svg";
import * as d3Hierarchy from "d3-hierarchy"
import * as d3Shape from "d3-shape";
import { Problem, Task } from "@/types";

// Props 인터페이스는 동일하게 정의
interface ProblemGraphProps {
  problems: Problem[];
  tasks: Task[];
  rootProblemId: string | null;
  width: number;
  height: number;
  nodeRadius?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

// 함수 선언 방식으로 컴포넌트 정의
export default function ProblemGraph({
  problems,
  tasks,
  rootProblemId,
  width,
  height,
  nodeRadius = 10,
  margin = { top: 20, right: 120, bottom: 20, left: 40 },
}: ProblemGraphProps): JSX.Element | null {
  // 반환 타입 명시 (선택 사항이지만 명확성을 위해 좋음)

  // ... (컴포넌트 로직은 이전과 동일) ...

  type GraphNodeDatum =
    | {
        type: "Problem";
        data: Problem;
        id: string;
        children?: GraphNodeDatum[];
      }
    | { type: "Task"; data: Task; id: string; children?: undefined };

  const buildHierarchyData = (
    currentProblemId: string | null
  ): GraphNodeDatum | null => {
    let currentProblem: Problem | undefined;
    if (currentProblemId === null) {
      currentProblem = problems.find((p) => p.parentId === null);
    } else {
      currentProblem = problems.find((p) => p.id === currentProblemId);
    }

    if (!currentProblem) return null;

    const graphNode: GraphNodeDatum = {
      type: "Problem",
      data: currentProblem,
      id: currentProblem.id,
    };

    if (
      currentProblem.childProblemIds &&
      currentProblem.childProblemIds.length > 0
    ) {
      graphNode.children = currentProblem.childProblemIds
        .map((childId) => buildHierarchyData(childId))
        .filter((child) => child !== null) as GraphNodeDatum[];
    } else {
      const associatedTasks = tasks.filter(
        (t) => t.problemId === currentProblem!.id
      );
      if (associatedTasks.length > 0) {
        graphNode.children = associatedTasks.map((task) => ({
          type: "Task",
          data: task,
          id: task.id,
        }));
      }
    }
    if (graphNode.children && graphNode.children.length === 0) {
      delete graphNode.children;
    }
    return graphNode;
  };

  const hierarchicalData = buildHierarchyData(rootProblemId);

  if (!hierarchicalData) {
    // JSX를 반환해야 하므로 null 대신 로딩 또는 데이터 없음 표시
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <SvgText>No data to display graph.</SvgText>
      </View>
    );
  }

  const root = d3Hierarchy.hierarchy<GraphNodeDatum>(hierarchicalData);
  const treeLayout = d3Hierarchy
    .tree<GraphNodeDatum>()
    .size([
      height - margin.top - margin.bottom,
      width - margin.left - margin.right,
    ]);

  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  const linkGenerator = d3Shape
    .linkHorizontal<any, d3Hierarchy.HierarchyPointNode<GraphNodeDatum>>()
    .x((d) => d.y + margin.left)
    .y((d) => d.x + margin.top);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <G>
          {links.map((link, i) => (
            <Path
              key={`link-${link.source.id}-${link.target.id}-${i}`}
              d={linkGenerator(link) || ""}
              fill="none"
              stroke="#ccc"
              strokeWidth={1}
            />
          ))}
          {nodes.map((node, i) => {
            const nodeDatum = node.data;
            let fillColor = "gray";
            let title = "Unknown";

            if (nodeDatum.type === "Problem") {
              fillColor = "green";
              title = nodeDatum.data.title;
            } else if (nodeDatum.type === "Task") {
              fillColor = "blue";
              title = nodeDatum.data.title;
            }

            const nodeX = node.y + margin.left;
            const nodeY = node.x + margin.top;

            return (
              <G key={`node-${nodeDatum.id}-${i}`} x={nodeX} y={nodeY}>
                <Circle r={nodeRadius} fill={fillColor} />
                <SvgText
                  x={node.children ? -nodeRadius - 5 : nodeRadius + 5}
                  y={nodeRadius / 2 - 2}
                  fontSize={10}
                  fill="#333"
                  textAnchor={node.children ? "end" : "start"}
                >
                  {title.length > 20 ? title.substring(0, 18) + "..." : title}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
