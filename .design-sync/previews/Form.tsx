import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Button,
} from "block23-gym";

export const NewMember = () => {
  const form = useForm({ defaultValues: { name: "", phone: "" } });
  return (
    <Form {...form}>
      <form
        style={{ width: 340, display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={form.handleSubmit(() => {})}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Juan Dela Cruz" {...field} />
              </FormControl>
              <FormDescription>As printed on the member ID.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input placeholder="0917 000 0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save member</Button>
      </form>
    </Form>
  );
};
