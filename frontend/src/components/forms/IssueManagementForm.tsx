import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";

import { useGetAllUsers } from "@/hooks/useUser";
import { useDeleteIssue } from "@/hooks/useIssue";
import { issueCategories, kanbanColumns } from "@/config/kanbanConfig";
import DeleteIssueDialog from "@/components/kanban/DeleteIssueDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Issue } from "@/types/kanbanTypes";
import type { User } from "@/types/userTypes";

type Props = {
  currentIssue?: Issue;
  projectId?: string;
  onSave: (formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">) => void;
  onCancel: () => void;
  isLoading: boolean;
};

const formSchema = z.object({
  issueCategory: z.string().min(1, "Required"),
  isBacklog: z.boolean({ required_error: "Required" }).default(false),
  issueCode: z.string(),
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  storyPoints: z
    .number()
    .min(1, "Select between 1-8 inclusive")
    .max(8, "Select between 1-8 inclusive"),
  assignee: z.string().min(1, "Required"),
  columnId: z.string().min(1, "Required"),
});

const IssueManagementForm = ({
  currentIssue,
  projectId,
  onSave,
  onCancel,
  isLoading: isLoading,
}: Props) => {
  const { data: users } = useGetAllUsers();
  const { mutateAsync: deleteIssue, isPending: isDeleteLoading } =
    useDeleteIssue();

  const form = useForm<Omit<Issue, "_id" | "createdAt" | "lastUpdated">>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueCategory: "",
      isBacklog: false,
      issueCode: "",
      name: "",
      description: "",
      storyPoints: 0,
      assignee: "",
      columnId: "",
    },
  });

  const handleDeleteIssue = (issueToDelete: Issue) => {
    deleteIssue(issueToDelete).then(() => {
      if (projectId) {
        onCancel();
      }
      toast.success("Issue deleted");
    });
  };

  useEffect(() => {
    if (!currentIssue) {
      return;
    }

    form.reset(currentIssue);
  }, [currentIssue, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="issueCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mx-2 pt-5 text-sm font-bold text-slate-700">
                Category:
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={currentIssue?.issueCategory}
              >
                <FormControl>
                  <SelectTrigger className="ml-2 w-[95%] rounded border px-2 py-1 text-sm font-normal text-gray-700 md:w-[30%]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {issueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <div className="mx-2 flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="issueCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">
                  Code:
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled
                    placeholder="JI-XXXXXX"
                    className="rounded border px-2 py-1 text-sm font-normal text-gray-700"
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700">
                  Name:
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="rounded border px-2 py-1 text-sm font-normal text-gray-700"
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mx-2 text-sm font-bold text-slate-700">
                Description:
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="mx-2 rounded border py-1 text-sm font-normal text-gray-700"
                />
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <div className="mx-2 flex w-full flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="storyPoints"
            render={({ field }) => (
              <FormItem className="w-full md:w-[30%]">
                <FormLabel className="text-sm font-bold text-slate-700">
                  Story Points:
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    max={8}
                    placeholder="1 - 8"
                    className="rounded border px-2 py-1 text-sm font-normal text-gray-700"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignee"
            render={({ field }) => (
              <FormItem className="w-full md:w-[50%]">
                <FormLabel className="text-sm font-bold text-slate-700">
                  Assignee:
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={currentIssue?.assignee}
                >
                  <FormControl>
                    <SelectTrigger className="w-full rounded border px-2 py-1 text-sm font-normal text-gray-700 md:w-[70%]">
                      <SelectValue placeholder="Assign..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: User) => (
                      <SelectItem key={user.racfid} value={user.name}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="columnId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mx-2 text-sm font-bold text-slate-700">
                Status:
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={currentIssue?.columnId}
              >
                <FormControl>
                  <SelectTrigger className="ml-2 w-[95%] rounded border px-2 py-1 text-sm font-normal text-gray-700 md:w-[30%]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {kanbanColumns.map((column) => (
                    <SelectItem key={column.columnId} value={column.columnId}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isBacklog"
          render={({ field }) => (
            <FormItem className="flex items-center space-y-0">
              <FormLabel className="mx-2 text-sm font-bold text-slate-700">
                Place in Backlog:
              </FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="ml-2 bg-white"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="mx-2 flex flex-col gap-5 md:flex-row">
          <Button
            type="submit"
            disabled={isLoading}
            className="my-2 w-full rounded-lg bg-amber-300 font-bold text-black hover:bg-amber-400 md:w-fit"
          >
            {isLoading ? "Saving..." : "Submit"}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isLoading}
            className="my-2 w-full rounded-lg bg-amber-300 font-bold text-black hover:bg-amber-400 md:w-fit"
          >
            Cancel
          </Button>
          {currentIssue && (
            <AlertDialog>
              <AlertDialogTrigger
                disabled={isDeleteLoading}
                className="my-2 w-full rounded-lg bg-red-500 px-2 py-2 text-sm font-bold text-white hover:bg-red-700 md:w-fit"
              >
                {isDeleteLoading ? "Deleting" : "Delete Issue"}
              </AlertDialogTrigger>
              <DeleteIssueDialog
                issue={currentIssue}
                handleDeleteIssue={handleDeleteIssue}
              />
            </AlertDialog>
          )}
        </div>
      </form>
    </Form>
  );
};

export default IssueManagementForm;
