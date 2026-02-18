import { seoConfig } from "@/lib/seo";

export default function NAPBlock() {
  return (
    <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 sm:p-8">
      <h3 className="font-heading text-lg font-bold text-white mb-4">
        Visit Us
      </h3>
      <address className="not-italic space-y-3 text-sm text-catalyst-grey-400">
        <p className="text-white font-semibold">{seoConfig.siteName}</p>
        <p>
          {seoConfig.address.street}
          <br />
          {seoConfig.address.city}, {seoConfig.address.state}{" "}
          {seoConfig.address.zip}
        </p>
        <p>
          <a
            href={seoConfig.phoneHref}
            className="text-catalyst-red-light hover:text-catalyst-red transition-colors"
          >
            {seoConfig.phone}
          </a>
        </p>
        {seoConfig.openingHours.length > 0 && (
          <div>
            <p className="text-catalyst-grey-300 font-medium mb-1">Hours</p>
            {seoConfig.openingHours.map((h) => (
              <p key={h}>{h.replace("-", " to ").replace("Mo", "Mon").replace("Fr", "Fri").replace("Sa", "Sat")}</p>
            ))}
          </div>
        )}
      </address>
      {seoConfig.googleBusinessUrl && (
        <a
          href={seoConfig.googleBusinessUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-sm text-catalyst-red-light hover:text-catalyst-red transition-colors"
        >
          View on Google Maps &rarr;
        </a>
      )}
    </div>
  );
}
