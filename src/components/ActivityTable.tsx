"use client";

import { useState } from "react";
import { ActivityStatus, Priority } from "@prisma/client";
import {
  Button,
  Collapse,
  Empty,
  Grid,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { DeleteOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import { ActivityStatusDot } from "./ActivityStatusDot";
import { PriorityBadge } from "./PriorityBadge";
import { SubtaskList } from "./SubtaskList";

type Activity = {
  id: string;
  title: string;
  priority: Priority;
  status: ActivityStatus;
  deadline: string | null;
  createdAt: string;
  subtasks: { id: string; title: string; completed: boolean; sortOrder: number }[];
};

type SortKey = "priority" | "deadline" | "createdAt";

const priorityOrder: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function compareBySortKey(a: Activity, b: Activity, sortBy: SortKey): number {
  if (sortBy === "priority") {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }
  if (sortBy === "deadline") {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function sortActivities(activities: Activity[], sortBy: SortKey): Activity[] {
  const inProgress = activities.filter((a) => a.status === ActivityStatus.IN_PROGRESS);
  const completed = activities.filter((a) => a.status === ActivityStatus.COMPLETED);
  const sortGroup = (group: Activity[]) =>
    [...group].sort((a, b) => compareBySortKey(a, b, sortBy));
  return [...sortGroup(inProgress), ...sortGroup(completed)];
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return "—";
  const date = new Date(deadline);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function ActivityTable({
  activities,
  onUpdate,
}: {
  activities: Activity[];
  onUpdate: () => void;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.md ?? false;
  const sorted = sortActivities(activities, sortBy);

  async function deleteActivity(id: string) {
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    onUpdate();
  }

  const columns: TableColumnsType<Activity> = [
    {
      key: "status",
      width: 36,
      align: "center",
      render: (_, record) => <ActivityStatusDot status={record.status} />,
    },
    {
      title: "Название",
      dataIndex: "title",
      key: "title",
      render: (title: string) => <Typography.Text strong>{title}</Typography.Text>,
    },
    {
      title: "Приоритет",
      dataIndex: "priority",
      key: "priority",
      width: 140,
      render: (priority: Priority) => <PriorityBadge priority={priority} />,
    },
    {
      title: "Дедлайн",
      dataIndex: "deadline",
      key: "deadline",
      width: 120,
      render: (deadline: string | null) => (
        <Typography.Text type={isOverdue(deadline) ? "danger" : "secondary"}>
          {formatDeadline(deadline)}
        </Typography.Text>
      ),
    },
    {
      key: "actions",
      width: 56,
      render: (_, record) => (
        <Popconfirm
          title="Удалить активность?"
          onConfirm={() => deleteActivity(record.id)}
          onPopupClick={(e) => e.stopPropagation()}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
            aria-label="Удалить активность"
          />
        </Popconfirm>
      ),
    },
  ];

  const sortControl = (
    <Space>
      <Typography.Text type="secondary">Сортировка</Typography.Text>
      <Select
        value={sortBy}
        onChange={setSortBy}
        style={{ minWidth: 180 }}
        options={[
          { value: "priority", label: "По приоритету" },
          { value: "deadline", label: "По дедлайну" },
          { value: "createdAt", label: "По дате создания" },
        ]}
      />
    </Space>
  );

  if (sorted.length === 0) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          {sortControl}
        </div>
        <Empty description="Нет активностей" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        {sortControl}
      </div>

      {isDesktop ? (
        <Table<Activity>
          columns={columns}
          dataSource={sorted}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys(keys as string[]),
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <SubtaskList
                activityId={record.id}
                subtasks={record.subtasks}
                onUpdate={onUpdate}
              />
            ),
            expandIcon: ({ expanded, onExpand, record }) => (
              <Button
                type="text"
                size="small"
                icon={expanded ? <DownOutlined /> : <RightOutlined />}
                onClick={(e) => onExpand(record, e)}
              />
            ),
          }}
        />
      ) : (
        <Collapse
          accordion={false}
          activeKey={expandedKeys}
          onChange={(keys) => setExpandedKeys(keys as string[])}
          items={sorted.map((activity) => ({
            key: activity.id,
            label: (
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <Space>
                  <ActivityStatusDot status={activity.status} />
                  <Typography.Text strong>{activity.title}</Typography.Text>
                </Space>
                <Space>
                  <PriorityBadge priority={activity.priority} />
                  <Typography.Text
                    type={isOverdue(activity.deadline) ? "danger" : "secondary"}
                    style={{ fontSize: 12 }}
                  >
                    {formatDeadline(activity.deadline)}
                  </Typography.Text>
                </Space>
              </Space>
            ),
            extra: (
              <Popconfirm
                title="Удалить активность?"
                onConfirm={() => deleteActivity(activity.id)}
                onPopupClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Удалить активность"
                />
              </Popconfirm>
            ),
            children: (
              <SubtaskList
                activityId={activity.id}
                subtasks={activity.subtasks}
                onUpdate={onUpdate}
              />
            ),
          }))}
        />
      )}
    </div>
  );
}
