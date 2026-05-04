import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  DIRECTIVE_KEY,
  PREAMBLE_KEY,
  collectTexts,
  collectButtons,
  findAllTexts,
  renderProps,
} from "../render-utils";

// ─── Alert Dialog renderer ────────────────────────────────────────────────────

function renderAlertDialog(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);
  const p3 = "  ".repeat(indent + 3);
  const p4 = "  ".repeat(indent + 4);

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts    = collectTexts(children);
  const buttons  = collectButtons(children);

  const title       = texts[0]  ?? "Are you absolutely sure?";
  const description = texts[1]  ?? "This action cannot be undone.";

  const isCancel = (b: ScannedNode) =>
    b.props.some(p => p.shadcnProp === "variant" && ["outline", "ghost", "secondary"].includes(p.value));
  const cancelBtn = buttons.find(isCancel) ?? buttons[1];
  const actionBtn = buttons.find(b => b !== cancelBtn) ?? buttons[0];
  const cancelLabel = typeof cancelBtn?.children === "string" ? cancelBtn.children : "Cancel";
  const actionLabel = typeof actionBtn?.children === "string" ? actionBtn.children : "Continue";

  const cancelVariant = cancelBtn?.props.find(p => p.shadcnProp === "variant")?.value;
  const actionVariant = actionBtn?.props.find(p => p.shadcnProp === "variant")?.value;

  const cancelProps = cancelVariant && cancelVariant !== "default" ? ` variant="${cancelVariant}"` : "";
  const actionProps = actionVariant && actionVariant !== "default" ? ` variant="${actionVariant}"` : "";

  const propsStr = renderProps(node.props);

  ["AlertDialog","AlertDialogTrigger","AlertDialogContent",
   "AlertDialogHeader","AlertDialogTitle","AlertDialogDescription",
   "AlertDialogFooter","AlertDialogCancel","AlertDialogAction"]
    .forEach(n => addImport(imports, "@/components/ui/alert-dialog", n));
  addImport(imports, "@/components/ui/button", "Button");

  return [
    `${p0}<AlertDialog${propsStr}>`,
    `${p1}<AlertDialogTrigger asChild>`,
    `${p2}<Button variant="outline">Open</Button>`,
    `${p1}</AlertDialogTrigger>`,
    `${p1}<AlertDialogContent>`,
    `${p2}<AlertDialogHeader>`,
    `${p3}<AlertDialogTitle>${title}</AlertDialogTitle>`,
    `${p3}<AlertDialogDescription>${description}</AlertDialogDescription>`,
    `${p2}</AlertDialogHeader>`,
    `${p2}<AlertDialogFooter>`,
    `${p3}<AlertDialogCancel${cancelProps}>${cancelLabel}</AlertDialogCancel>`,
    `${p3}<AlertDialogAction${actionProps}>${actionLabel}</AlertDialogAction>`,
    `${p2}</AlertDialogFooter>`,
    `${p1}</AlertDialogContent>`,
    `${p0}</AlertDialog>`,
  ].join("\n");
}

// ─── Hover Card renderer ──────────────────────────────────────────────────────

function renderHoverCard(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  addImport(imports, INSTALL_KEY,                    "pnpm dlx shadcn@latest add hover-card avatar");
  addImport(imports, "@/components/ui/hover-card",   "HoverCard");
  addImport(imports, "@/components/ui/hover-card",   "HoverCardContent");
  addImport(imports, "@/components/ui/hover-card",   "HoverCardTrigger");
  addImport(imports, "@/components/ui/button",       "Button");
  addImport(imports, "@/components/ui/avatar",       "Avatar");
  addImport(imports, "@/components/ui/avatar",       "AvatarFallback");
  addImport(imports, "@/components/ui/avatar",       "AvatarImage");
  addImport(imports, "lucide-react",                 "CalendarDays");

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts    = collectTexts(children);
  const trigger  = texts[0] ?? "@nextjs";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);
  const p4  = "  ".repeat(indent + 4);

  return [
    `${pad}<HoverCard>`,
    `${p1}<HoverCardTrigger asChild>`,
    `${p2}<Button variant="link">${trigger}</Button>`,
    `${p1}</HoverCardTrigger>`,
    `${p1}<HoverCardContent className="w-80">`,
    `${p2}<div className="flex justify-between space-x-4">`,
    `${p3}<Avatar>`,
    `${p4}<AvatarImage src="https://github.com/vercel.png" />`,
    `${p4}<AvatarFallback>VC</AvatarFallback>`,
    `${p3}</Avatar>`,
    `${p3}<div className="space-y-1">`,
    `${p4}<h4 className="text-sm font-semibold">${trigger}</h4>`,
    `${p4}<p className="text-sm">The React Framework – created and maintained by @vercel.</p>`,
    `${p4}<div className="flex items-center pt-2">`,
    `${p4}  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />`,
    `${p4}  <span className="text-xs text-muted-foreground">Joined December 2021</span>`,
    `${p4}</div>`,
    `${p3}</div>`,
    `${p2}</div>`,
    `${p1}</HoverCardContent>`,
    `${pad}</HoverCard>`,
  ].join("\n");
}

// ─── Drawer renderer ──────────────────────────────────────────────────────────

function renderDrawer(
  _node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  addImport(imports, INSTALL_KEY,               "pnpm dlx shadcn@latest add drawer");
  addImport(imports, "@/components/ui/button",  "Button");
  addImport(imports, "@/components/ui/drawer",  "Drawer");
  addImport(imports, "@/components/ui/drawer",  "DrawerClose");
  addImport(imports, "@/components/ui/drawer",  "DrawerContent");
  addImport(imports, "@/components/ui/drawer",  "DrawerDescription");
  addImport(imports, "@/components/ui/drawer",  "DrawerFooter");
  addImport(imports, "@/components/ui/drawer",  "DrawerHeader");
  addImport(imports, "@/components/ui/drawer",  "DrawerTitle");
  addImport(imports, "@/components/ui/drawer",  "DrawerTrigger");

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  addImport(imports, PREAMBLE_KEY,
    `const DRAWER_SIDES = ["top", "right", "bottom", "left"] as const`
  );

  return [
    `${pad}<div className="flex flex-wrap gap-2">`,
    `${p1}{DRAWER_SIDES.map((side) => (`,
    `${p2}<Drawer`,
    `${p2}  key={side}`,
    `${p2}  direction={side === "bottom" ? undefined : (side as "top" | "right" | "left")}`,
    `${p2}>`,
    `${p3}<DrawerTrigger asChild>`,
    `${p3}  <Button variant="outline" className="capitalize">{side}</Button>`,
    `${p3}</DrawerTrigger>`,
    `${p3}<DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">`,
    `${p3}  <DrawerHeader>`,
    `${p3}    <DrawerTitle>Move Goal</DrawerTitle>`,
    `${p3}    <DrawerDescription>Set your daily activity goal.</DrawerDescription>`,
    `${p3}  </DrawerHeader>`,
    `${p3}  <div className="no-scrollbar overflow-y-auto px-4">`,
    `${p3}    {Array.from({ length: 5 }).map((_, i) => (`,
    `${p3}      <p key={i} className="mb-4 leading-normal">`,
    `${p3}        Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    `${p3}      </p>`,
    `${p3}    ))}`,
    `${p3}  </div>`,
    `${p3}  <DrawerFooter>`,
    `${p3}    <Button>Submit</Button>`,
    `${p3}    <DrawerClose asChild>`,
    `${p3}      <Button variant="outline">Cancel</Button>`,
    `${p3}    </DrawerClose>`,
    `${p3}  </DrawerFooter>`,
    `${p3}</DrawerContent>`,
    `${p2}</Drawer>`,
    `${p1}  ))}`,
    `${pad}</div>`,
  ].join("\n");
}

// ─── Dialog helpers ───────────────────────────────────────────────────────────

function dialogImports(imports: ImportMap) {
  addImport(imports, INSTALL_KEY,                  "pnpm dlx shadcn@latest add dialog");
  addImport(imports, "@/components/ui/button",     "Button");
  addImport(imports, "@/components/ui/dialog",     "Dialog");
  addImport(imports, "@/components/ui/dialog",     "DialogClose");
  addImport(imports, "@/components/ui/dialog",     "DialogContent");
  addImport(imports, "@/components/ui/dialog",     "DialogDescription");
  addImport(imports, "@/components/ui/dialog",     "DialogFooter");
  addImport(imports, "@/components/ui/dialog",     "DialogHeader");
  addImport(imports, "@/components/ui/dialog",     "DialogTitle");
  addImport(imports, "@/components/ui/dialog",     "DialogTrigger");
}

function renderDialog(
  _node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  dialogImports(imports);
  addImport(imports, "@/components/ui/field",  "Field");
  addImport(imports, "@/components/ui/field",  "FieldGroup");
  addImport(imports, "@/components/ui/input",  "Input");
  addImport(imports, "@/components/ui/label",  "Label");

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  return [
    `${pad}<Dialog>`,
    `${p1}<form>`,
    `${p2}<DialogTrigger asChild>`,
    `${p3}<Button variant="outline">Open Dialog</Button>`,
    `${p2}</DialogTrigger>`,
    `${p2}<DialogContent className="sm:max-w-sm">`,
    `${p3}<DialogHeader>`,
    `${p3}  <DialogTitle>Edit profile</DialogTitle>`,
    `${p3}  <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>`,
    `${p3}</DialogHeader>`,
    `${p3}<FieldGroup>`,
    `${p3}  <Field>`,
    `${p3}    <Label htmlFor="name">Name</Label>`,
    `${p3}    <Input id="name" name="name" defaultValue="Pedro Duarte" />`,
    `${p3}  </Field>`,
    `${p3}  <Field>`,
    `${p3}    <Label htmlFor="username">Username</Label>`,
    `${p3}    <Input id="username" name="username" defaultValue="@peduarte" />`,
    `${p3}  </Field>`,
    `${p3}</FieldGroup>`,
    `${p3}<DialogFooter>`,
    `${p3}  <DialogClose asChild>`,
    `${p3}    <Button variant="outline">Cancel</Button>`,
    `${p3}  </DialogClose>`,
    `${p3}  <Button type="submit">Save changes</Button>`,
    `${p3}</DialogFooter>`,
    `${p2}</DialogContent>`,
    `${p1}</form>`,
    `${pad}</Dialog>`,
  ].join("\n");
}

function renderDialogHeader(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  dialogImports(imports);
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const type     = typeProp?.value ?? "header";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  if (type === "close-only" || type === "icon-close") {
    addImport(imports, "lucide-react", "X");
    return [
      `${pad}<DialogHeader>`,
      `${p1}<DialogTitle>Dialog Title</DialogTitle>`,
      `${p1}<DialogClose asChild>`,
      `${p1}  <Button variant="ghost" size="icon" className="absolute right-4 top-4"><X className="h-4 w-4" /></Button>`,
      `${p1}</DialogClose>`,
      `${pad}</DialogHeader>`,
    ].join("\n");
  }

  return [
    `${pad}<DialogHeader>`,
    `${p1}<DialogTitle>Dialog Title</DialogTitle>`,
    `${p1}<DialogDescription>Dialog description goes here.</DialogDescription>`,
    `${pad}</DialogHeader>`,
  ].join("\n");
}

function renderDialogFooter(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  dialogImports(imports);
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const type     = typeProp?.value ?? "2-buttons-right";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  if (type === "1-full-width") {
    return [
      `${pad}<DialogFooter>`,
      `${p1}<Button type="submit" className="w-full">Save changes</Button>`,
      `${pad}</DialogFooter>`,
    ].join("\n");
  }

  if (type === "2-full-width") {
    return [
      `${pad}<DialogFooter className="flex-col gap-2 sm:flex-col">`,
      `${p1}<Button type="submit" className="w-full">Save changes</Button>`,
      `${p1}<DialogClose asChild>`,
      `${p1}  <Button variant="outline" className="w-full">Cancel</Button>`,
      `${p1}</DialogClose>`,
      `${pad}</DialogFooter>`,
    ].join("\n");
  }

  return [
    `${pad}<DialogFooter>`,
    `${p1}<DialogClose asChild>`,
    `${p1}  <Button variant="outline">Cancel</Button>`,
    `${p1}</DialogClose>`,
    `${p1}<Button type="submit">Save changes</Button>`,
    `${pad}</DialogFooter>`,
  ].join("\n");
}

// ─── Command renderer ─────────────────────────────────────────────────────────

function renderCommand(
  _node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add command");
  addImport(imports, "lucide-react",              "Calendar");
  addImport(imports, "lucide-react",              "Smile");
  addImport(imports, "lucide-react",              "Calculator");
  addImport(imports, "lucide-react",              "User");
  addImport(imports, "lucide-react",              "CreditCard");
  addImport(imports, "lucide-react",              "Settings");
  addImport(imports, "@/components/ui/command",   "Command");
  addImport(imports, "@/components/ui/command",   "CommandEmpty");
  addImport(imports, "@/components/ui/command",   "CommandGroup");
  addImport(imports, "@/components/ui/command",   "CommandInput");
  addImport(imports, "@/components/ui/command",   "CommandItem");
  addImport(imports, "@/components/ui/command",   "CommandList");
  addImport(imports, "@/components/ui/command",   "CommandSeparator");
  addImport(imports, "@/components/ui/command",   "CommandShortcut");

  return [
    `${pad}<Command className="max-w-sm rounded-lg border">`,
    `${p1}<CommandInput placeholder="Type a command or search..." />`,
    `${p1}<CommandList>`,
    `${p2}<CommandEmpty>No results found.</CommandEmpty>`,
    `${p2}<CommandGroup heading="Suggestions">`,
    `${p3}<CommandItem><Calendar /><span>Calendar</span></CommandItem>`,
    `${p3}<CommandItem><Smile /><span>Search Emoji</span></CommandItem>`,
    `${p3}<CommandItem disabled><Calculator /><span>Calculator</span></CommandItem>`,
    `${p2}</CommandGroup>`,
    `${p2}<CommandSeparator />`,
    `${p2}<CommandGroup heading="Settings">`,
    `${p3}<CommandItem><User /><span>Profile</span><CommandShortcut>⌘P</CommandShortcut></CommandItem>`,
    `${p3}<CommandItem><CreditCard /><span>Billing</span><CommandShortcut>⌘B</CommandShortcut></CommandItem>`,
    `${p3}<CommandItem><Settings /><span>Settings</span><CommandShortcut>⌘S</CommandShortcut></CommandItem>`,
    `${p2}</CommandGroup>`,
    `${p1}</CommandList>`,
    `${pad}</Command>`,
  ].join("\n");
}

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Alert Dialog": {
      component:  "AlertDialog",
      importPath: "@/components/ui/alert-dialog",
      ignore: ["Type"],
    },

    "Hover Card": {
      component:  "__hover_card__",
      importPath: "@/components/ui/hover-card",
    },

    "Drawer": {
      component:  "__drawer__",
      importPath: "@/components/ui/drawer",
    },

    "Dialog": {
      component:  "__dialog__",
      importPath: "@/components/ui/dialog",
      ignore:     ["Type"],
    },

    "Dialog Header": {
      component:  "__dialog_header__",
      importPath: "@/components/ui/dialog",
      props: {
        "Type": {
          shadcnProp: "type",
          values: { "Header": "header", "Close Only": "close-only", "Icon Button Close": "icon-close" },
        },
      },
    },

    "Dialog Footer": {
      component:  "__dialog_footer__",
      importPath: "@/components/ui/dialog",
      props: {
        "Type": {
          shadcnProp: "type",
          values: {
            "2 Buttons Right":          "2-buttons-right",
            "2 Full-width Buttons":     "2-full-width",
            "Single Full-width Button": "1-full-width",
          },
        },
      },
    },

    "Command": {
      component:  "__command__",
      importPath: "@/components/ui/command",
    },
  },

  renderers: {
    "AlertDialog":        renderAlertDialog,
    "__hover_card__":     renderHoverCard,
    "__drawer__":         renderDrawer,
    "__dialog__":         renderDialog,
    "__dialog_header__":  renderDialogHeader,
    "__dialog_footer__":  renderDialogFooter,
    "__command__":        renderCommand,
  },
};
