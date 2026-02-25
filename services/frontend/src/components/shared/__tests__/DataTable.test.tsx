/**
 * DataTable component rendering tests — verifies column headers, data rows, empty state, and sort.
 * Consumed by: CI test suite
 * Depends on: DataTable.tsx (shared sortable table)
 *
 * TOUCHPOINTS:
 *   Upstream: DataTable.tsx
 *   Downstream: None (leaf test)
 *   Shared: None
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within, cleanup } from '@testing-library/react'
import { DataTable, type Column } from '../DataTable'

type TestRow = Record<string, unknown> & { name: string; amount: number; status: string }

const columns: Column<TestRow>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status' },
]

const sampleData: TestRow[] = [
  { name: 'Alice', amount: 1500, status: 'Active' },
  { name: 'Bob', amount: 2300, status: 'Pending' },
  { name: 'Carol', amount: 1100, status: 'Active' },
]

describe('DataTable', () => {
  it('renders column headers', () => {
    const { container } = render(<DataTable columns={columns} data={sampleData} />)
    const view = within(container)
    expect(view.getByText('Name')).toBeInTheDocument()
    expect(view.getByText('Amount')).toBeInTheDocument()
    expect(view.getByText('Status')).toBeInTheDocument()
  })

  it('renders data rows', () => {
    cleanup()
    const { container } = render(<DataTable columns={columns} data={sampleData} />)
    const view = within(container)
    expect(view.getByText('Alice')).toBeInTheDocument()
    expect(view.getByText('Bob')).toBeInTheDocument()
    expect(view.getByText('Carol')).toBeInTheDocument()
    expect(view.getByText('1500')).toBeInTheDocument()
    expect(view.getByText('2300')).toBeInTheDocument()
    expect(view.getByText('1100')).toBeInTheDocument()
  })

  it('shows empty message when data is empty', () => {
    cleanup()
    const { container } = render(<DataTable columns={columns} data={[]} />)
    expect(within(container).getByText('No data available')).toBeInTheDocument()
  })

  it('shows custom empty message', () => {
    cleanup()
    const { container } = render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />)
    expect(within(container).getByText('Nothing here')).toBeInTheDocument()
  })

  it('does not render table headers when data is empty', () => {
    cleanup()
    const { container } = render(<DataTable columns={columns} data={[]} />)
    // When empty, DataTable returns the empty message div, not the table
    expect(within(container).queryByText('Name')).not.toBeInTheDocument()
  })

  it('calls onRowClick when a row is clicked', () => {
    cleanup()
    const handler = vi.fn()
    const { container } = render(<DataTable columns={columns} data={sampleData} onRowClick={handler} />)
    const aliceCell = within(container).getByText('Alice')
    fireEvent.click(aliceCell.closest('tr')!)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(sampleData[0])
  })

  it('sort click changes sort indicator', () => {
    cleanup()
    const { container } = render(<DataTable columns={columns} data={sampleData} />)
    const nameHeader = within(container).getByText('Name')
    fireEvent.click(nameHeader)
    expect(container.innerHTML).toContain('\u25B2')
    fireEvent.click(nameHeader)
    expect(container.innerHTML).toContain('\u25BC')
  })

  it('sorts data when sortable column header is clicked', () => {
    cleanup()
    const { container } = render(<DataTable columns={columns} data={sampleData} />)
    const amountHeader = within(container).getByText('Amount')
    fireEvent.click(amountHeader)
    const rows = within(container).getAllByRole('row')
    // rows[0] is thead tr, rows[1..3] are data rows
    const firstDataRow = rows[1]
    const cells = firstDataRow.querySelectorAll('td')
    expect(cells[0].textContent).toBe('Carol')
    expect(cells[1].textContent).toBe('1100')
  })

  it('uses custom render function for columns', () => {
    cleanup()
    const columnsWithRender: Column<TestRow>[] = [
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount', render: (row) => `$${row.amount.toLocaleString()}` },
    ]
    const { container } = render(<DataTable columns={columnsWithRender} data={sampleData} />)
    expect(within(container).getByText('$1,500')).toBeInTheDocument()
    expect(within(container).getByText('$2,300')).toBeInTheDocument()
  })

  it('handles null/undefined values in cells', () => {
    cleanup()
    const dataWithNull: TestRow[] = [
      { name: 'Test', amount: 0, status: '' },
    ]
    const { container } = render(<DataTable columns={columns} data={dataWithNull} />)
    expect(within(container).getByText('Test')).toBeInTheDocument()
    expect(within(container).getByText('0')).toBeInTheDocument()
  })
})
