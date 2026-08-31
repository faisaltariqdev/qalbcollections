import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getProductFormOptions } from "@/server/admin/products";

const BLANK: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  brand: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  story: "",
  price: "",
  compareAtPrice: "",
  currency: "PKR",
  stock: "1",
  lowStockThreshold: "2",
  allowBackorder: false,
  status: "DRAFT",
  featured: false,
  newArrival: true,
  bestseller: false,
  comingSoon: false,
  limited: false,
  exclusive: false,
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  ogImageUrl: "",
  socialTitle: "",
  socialDescription: "",
  noIndex: false,
  images: [],
  attributes: [],
  collectionIds: [],
  tagIds: [],
  faqs: [],
};

export default async function NewProductPage() {
  await requireAdminPage("product.write");
  const options = await getProductFormOptions();

  return (
    <>
      <PageHeader
        title="New product"
        description="Save as a draft at any point. A piece needs at least one image before it can be published."
        breadcrumb={{ href: "/admin/products", label: "Products" }}
      />
      <ProductForm
        initial={{
          ...BLANK,
          // Pre-select the first category so its specification fields are visible.
          categoryId: options.categories[0]?.id ?? "",
        }}
        options={options}
      />
    </>
  );
}
