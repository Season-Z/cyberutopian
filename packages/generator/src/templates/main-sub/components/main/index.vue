<script lang="tsx" setup>
import { syService } from '@/services';
import {
  ProcedureDefinition,
  ProcedureDefinitionPageSearchRequest,
  ProcedureDefinitionSaveRequest,
} from '@/services/types-主数据管理';
import { TableSearchDataType } from '@enhance/define-table/dist/typings';
import useColumns from './hooks/useColumns';
import useFields from './hooks/useFields';

const customFields = useFields();
const customColumns = useColumns();
</script>

<template>
  <define-table
    tableCode="DFS2023022200002_GENERAL_com.shuyilink.linkim.main.data.admin.entity.ProcedureDefinition"
    tableName="tableName"
    :apis="{
      add: (data: ProcedureDefinitionSaveRequest) =>
        syService['postMainDataProcedureDefinition']({
          data: data,
        }),
      edit: (data: ProcedureDefinition) => syService['putMainDataProcedureDefinition']({ data: data }),
      delete: (data: number[]) => syService['postMainDataProcedureDefinitionBatchDelete']({ data }),
      search: async (data: TableSearchDataType<ProcedureDefinitionPageSearchRequest>) => {
        return syService['postMainDataProcedureDefinitionPage']({
          data,
        });
      },
      export: () => { },
      
    }"
    :hooks="{
      openDialog: (data: any) => {
        // 打开弹窗的回调。这里定义打开弹窗初始化数据；
        return data;
      },
    }"
    :table-props="{}"
    :customFields="customFields"
    :customColumn="customColumns"
  >
  </define-table>
</template>
