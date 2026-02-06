<script lang="tsx" setup>
import { syService } from '@/services';
import {
  ProcedureDefinition,
  ProcedureDefinitionPageSearchRequest,
  ProcedureDefinitionSaveRequest,
} from '@/services/types-主数据管理';
import { EnhanceTable, TableCondition, TableHeader } from '@enhance/define-table';
import { TableSearchDataType } from '@enhance/define-table/dist/typings';
import settings from './config.json';
import useColumns from './hooks/useColumns';
import useFields from './hooks/useFields';

const customFields = useFields();
const customColumns = useColumns();
</script>

<template>
  <enhance-table
    :unstableData="{
      settings
    }"
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
      export: () => {},
    }"
    :hooks="{
      openDialog: (data) => {
        // 打开弹窗的回调。这里定义打开弹窗初始化数据；
        return data;
      },
    }"
    :table-props="{}"
    :customFields="customFields"
    :customColumn="customColumns"
  >
    <template #table-header="{ selectedRows, searchData }">
      <table-header :selectedRows="selectedRows" :searchData="searchData" />
    </template>

    <template #table-condition="{ selectedRows, handleSubmit }">
      <table-condition :selectedRows="selectedRows" @handleSubmit="handleSubmit" />
    </template>
  </enhance-table>
</template>
