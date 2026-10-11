"use client";

import { Laptop as LaptopIcon } from "lucide-react";
import { useState } from "react";

import styles from "./laptop.module.css";

export function Gallery({ images, name }: { images: string[]; name: string }) {
	const [failed, setFailed] = useState<string[]>([]);
	const usable = images.filter((src) => !failed.includes(src));
	const [selected, setSelected] = useState(0);
	const current = usable[Math.min(selected, usable.length - 1)];
	const fail = (src: string) => setFailed((f) => [...f, src]);

	return (
		<div className={styles.gallery}>
			<div className={styles.stage}>
				{current ? (
					<img
						key={current}
						src={current}
						alt={name}
						referrerPolicy="no-referrer"
						onError={() => fail(current)}
					/>
				) : (
					<div className={styles.noImage}>
						<LaptopIcon size={40} strokeWidth={1.25} aria-hidden />
						<span>No photo from the store</span>
					</div>
				)}
			</div>
			{usable.length > 1 && (
				<ul className={styles.thumbs} aria-label="Photos">
					{usable.map((src, i) => (
						<li key={src}>
							<button
								type="button"
								className={styles.thumbButton}
								aria-label={`Photo ${i + 1} of ${usable.length}`}
								aria-pressed={src === current}
								onClick={() => setSelected(i)}
							>
								<img
									src={src}
									alt=""
									loading="lazy"
									referrerPolicy="no-referrer"
									onError={() => fail(src)}
								/>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
