import sys
p = "/Users/pranay/Projects/trucking/products/product-01-cargo-fit/src/engine/solver.ts"
src = open(p).read()
start = src.index("function runOnce(")
end = src.index("function cmp(")
new = open("/Users/pranay/.gemini/antigravity/brain/4d7da104-1e00-4e1c-bf15-fe4a3c5ae1e2/scratch/runonce_new.txt").read()
open(p, "w").write(src[:start] + new + src[end:])
print("ok")
