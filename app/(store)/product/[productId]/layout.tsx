import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Captyn - Product",
};

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ProductLayout;
