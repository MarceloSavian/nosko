import { z } from 'zod/v4';
import {
  budgetCategorySchema,
  createBudgetCategoryInputSchema,
  updateBudgetCategoryInputSchema,
} from '../../domain/models/budget/BudgetCategory.js';
import {
  budgetItemSchema,
  budgetPlanSchema,
  createBudgetItemInputSchema,
  createBudgetPlanInputSchema,
  updateBudgetItemInputSchema,
} from '../../domain/models/budget/BudgetPlan.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

const budgetPlanWithItemsSchema = z.object({
  plan: budgetPlanSchema,
  items: budgetItemSchema.array(),
});

export const budgetRouteMetas: RouteMeta[] = [
  {
    method: 'get',
    path: '/v1/budget-categories',
    summary: 'List all budget categories',
    tags: ['Budget Categories'],
    auth: true,
    responses: {
      200: { description: 'List of categories', schema: budgetCategorySchema.array() },
    },
  },
  {
    method: 'post',
    path: '/v1/budget-categories',
    summary: 'Create a budget category',
    tags: ['Budget Categories'],
    auth: true,
    request: { body: createBudgetCategoryInputSchema },
    responses: {
      201: { description: 'Category created', schema: budgetCategorySchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'put',
    path: '/v1/budget-categories/{id}',
    summary: 'Update a budget category',
    tags: ['Budget Categories'],
    auth: true,
    request: { body: updateBudgetCategoryInputSchema },
    responses: {
      200: { description: 'Category updated', schema: budgetCategorySchema },
      404: { description: 'Category not found' },
    },
  },
  {
    method: 'delete',
    path: '/v1/budget-categories/{id}',
    summary: 'Delete a budget category',
    tags: ['Budget Categories'],
    auth: true,
    responses: {
      204: { description: 'Category deleted' },
      404: { description: 'Category not found' },
    },
  },
  {
    method: 'get',
    path: '/v1/budget-plans',
    summary: 'Get personal budget plan for a month',
    tags: ['Budget Plans'],
    auth: true,
    responses: {
      200: { description: 'Personal plan with items', schema: budgetPlanWithItemsSchema },
    },
  },
  {
    method: 'post',
    path: '/v1/budget-plans',
    summary: 'Create a personal budget plan',
    tags: ['Budget Plans'],
    auth: true,
    request: { body: createBudgetPlanInputSchema },
    responses: {
      201: { description: 'Plan created', schema: budgetPlanWithItemsSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'delete',
    path: '/v1/budget-plans/{id}',
    summary: 'Delete a personal budget plan',
    tags: ['Budget Plans'],
    auth: true,
    responses: {
      204: { description: 'Plan deleted' },
      404: { description: 'Plan not found' },
    },
  },
  {
    method: 'get',
    path: '/v1/partnership/budget-plans',
    summary: 'Get joint budget plan for a month',
    tags: ['Budget Plans'],
    auth: true,
    responses: {
      200: { description: 'Joint plan with items', schema: budgetPlanWithItemsSchema },
    },
  },
  {
    method: 'post',
    path: '/v1/partnership/budget-plans',
    summary: 'Create a joint budget plan',
    tags: ['Budget Plans'],
    auth: true,
    request: { body: createBudgetPlanInputSchema },
    responses: {
      201: { description: 'Joint plan created', schema: budgetPlanWithItemsSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'delete',
    path: '/v1/partnership/budget-plans/{id}',
    summary: 'Delete a joint budget plan',
    tags: ['Budget Plans'],
    auth: true,
    responses: {
      204: { description: 'Joint plan deleted' },
      404: { description: 'Plan not found' },
    },
  },
  {
    method: 'get',
    path: '/v1/budget-plans/summary',
    summary: 'Get budget summary comparing planned vs actual',
    tags: ['Budget Plans'],
    auth: true,
    responses: {
      200: { description: 'Budget summary' },
    },
  },
  {
    method: 'post',
    path: '/v1/budget-plans/{planId}/items',
    summary: 'Add an item to a budget plan',
    tags: ['Budget Items'],
    auth: true,
    request: { body: createBudgetItemInputSchema },
    responses: {
      201: { description: 'Item added', schema: budgetItemSchema },
      400: { description: 'Validation error' },
    },
  },
  {
    method: 'put',
    path: '/v1/budget-plans/{planId}/items/{id}',
    summary: 'Update a budget item',
    tags: ['Budget Items'],
    auth: true,
    request: { body: updateBudgetItemInputSchema },
    responses: {
      200: { description: 'Item updated', schema: budgetItemSchema },
      404: { description: 'Item not found' },
    },
  },
  {
    method: 'delete',
    path: '/v1/budget-plans/{planId}/items/{id}',
    summary: 'Delete a budget item',
    tags: ['Budget Items'],
    auth: true,
    responses: {
      204: { description: 'Item deleted' },
      404: { description: 'Item not found' },
    },
  },
];
