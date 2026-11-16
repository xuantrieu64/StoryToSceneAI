import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpDown,
  CheckCircle2,
  LoaderCircle,
  TriangleAlert,
} from 'lucide-react'
import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPing } from '@/lib/api'

const formSchema = z.object({
  name: z.string().min(2, 'Enter at least 2 characters.'),
  email: z.email('Enter a valid email address.'),
})

type FormValues = z.infer<typeof formSchema>

type Person = {
  name: string
  role: string
  scenes: number
}

const people: Person[] = [
  { name: 'Morgan Lee', role: 'Writer', scenes: 3 },
  { name: 'Alex Kim', role: 'Editor', scenes: 5 },
  { name: 'Jamie Rivera', role: 'Artist', scenes: 2 },
]

const tableFeaturesConfig = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
})

const columns: ColumnDef<typeof tableFeaturesConfig, Person>[] = [
  { accessorKey: 'name', header: 'Name', sortFn: 'alphanumeric' },
  { accessorKey: 'role', header: 'Role', sortFn: 'alphanumeric' },
  {
    accessorKey: 'scenes',
    header: 'Scenes',
    sortFn: (rowA, rowB, columnId) =>
      Number(rowA.getValue(columnId)) - Number(rowB.getValue(columnId)),
  },
]

function ProfileForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '' },
  })

  function onSubmit(values: FormValues) {
    toast.success('Form validation passed.', {
      description: `Hello, ${values.name}.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>React Hook Form + Zod</CardTitle>
        <CardDescription>
          Submit an empty or invalid value to see validation errors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="smoke-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="smoke-name"
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="smoke-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="smoke-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                  />
                  <FieldDescription>
                    A valid email address is required.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <Button type="submit">Validate form</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ApiPing() {
  const query = useQuery({
    queryKey: ['api', 'ping'],
    queryFn: getPing,
    enabled: false,
    retry: false,
  })

  async function checkApi() {
    const result = await query.refetch()
    if (result.isSuccess) {
      toast.success('API ping succeeded.')
    } else if (result.isError) {
      toast.error('API ping failed.', { description: result.error.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>TanStack Query</CardTitle>
        <CardDescription>
          Sends GET to <code>{import.meta.env.VITE_API_URL}/ping</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkApi} disabled={query.isFetching}>
          {query.isFetching ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            'Check API'
          )}
        </Button>
        <div aria-live="polite" className="text-sm">
          {query.isFetching && <p>Loading ping response…</p>}
          {query.isError && (
            <p className="flex items-start gap-2 text-destructive">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4" />
              {query.error.message}
            </p>
          )}
          {query.isSuccess && (
            <p className="flex items-start gap-2 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4" />
              <span>{JSON.stringify(query.data)}</span>
            </p>
          )}
          {!query.isFetching && !query.isError && !query.isSuccess && (
            <p className="text-muted-foreground">
              The request runs when you press the button.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SortableTable() {
  const table = useTable({
    features: tableFeaturesConfig,
    columns,
    data: people,
  })

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>TanStack Table</CardTitle>
        <CardDescription>
          Select a column heading to sort the sample rows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <button
                        className="inline-flex items-center gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <ArrowUpDown aria-hidden="true" className="size-4" />
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function Smoke() {
  return (
    <main className="mx-auto grid min-h-svh max-w-6xl gap-6 bg-muted/40 p-6 md:grid-cols-2">
      <header className="md:col-span-2">
        <h1 className="text-2xl font-semibold">Frontend library smoke tests</h1>
      </header>
      <ProfileForm />
      <ApiPing />
      <SortableTable />
    </main>
  )
}
