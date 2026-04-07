import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StockForm } from "@/components/admin/stock-form";

export default async function EditStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stock = await prisma.stock.findUnique({ where: { id } });
  if (!stock) notFound();

  return <StockForm stock={stock} />;
}
