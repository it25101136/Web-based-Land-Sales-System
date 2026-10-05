/**
 * Member 2: Land Management & Search
 * Frontend Component handling Land Search Filters, Land Card Display,
 * Listing Creation Form, and Perch Price Unit Conversions.
 */

export const LandManagementSearch = {
  activeFilters: {
    district: '',
    landType: '',
    minPrice: '',
    maxPrice: '',
    minPerches: '',
    nearHighway: false,
    sort: 'newest'
  },

  renderSearchPanel() {
    return `
      <section class="search-hero-panel">
        <div class="search-box-card">
          <h2>Find Land in Sri Lanka</h2>
          <p>Search over hundreds of verified agricultural, residential, and commercial properties.</p>

          <form id="land-filter-form" onsubmit="LandManagementSearch.applyFilters(event)">
            <div class="filter-row">
              <div class="filter-col">
                <label>District</label>
                <select id="filter-district">
                  <option value="">All 25 Districts</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
                  <option value="Matara">Matara</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Anuradhapura">Anuradhapura</option>
                </select>
              </div>

              <div class="filter-col">
                <label>Land Type</label>
                <select id="filter-type">
                  <option value="">All Types</option>
                  <option value="Residential">Residential</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Coconut">Coconut Land</option>
                  <option value="Tea">Tea Land</option>
                  <option value="Paddy">Paddy Land</option>
                  <option value="Beach">Beachfront</option>
                </select>
              </div>

              <div class="filter-col">
                <label>Max Price (LKR)</label>
                <input type="number" id="filter-max-price" placeholder="e.g. 15,000,000" />
              </div>

              <div class="filter-col">
                <label>Min Size (Perches)</label>
                <input type="number" id="filter-min-perches" placeholder="e.g. 15" />
              </div>

              <div class="filter-col btn-col">
                <button type="submit" class="btn btn-primary">Search Properties</button>
              </div>
            </div>

            <div class="filter-extra-row">
              <label class="checkbox-label">
                <input type="checkbox" id="filter-highway" /> Near Expressway Exit (E01 / E02 / E03 / E04)
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="filter-verified" /> Verified Title Deeds Only
              </label>
            </div>
          </form>
        </div>
      </section>
    `;
  },

  renderLandCard(land) {
    const formattedPrice = Number(land.price).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' });
    const formattedPpp = Number(land.pricePerPerch).toLocaleString('en-LK', { style: 'currency', currency: 'LKR' });

    return `
      <article class="land-card" id="land-${land.id}">
        <div class="land-card-img-wrap">
          <img src="${land.coverImageUrl || '/img/land1.jpg'}" alt="${land.title}" loading="lazy" />
          <span class="land-badge-type">${land.landType}</span>
          ${land.verificationStatus === 'VERIFIED' ? '<span class="land-badge-verified">✓ Verified</span>' : ''}
        </div>
        <div class="land-card-body">
          <div class="land-location">📍 ${land.city}, ${land.district}</div>
          <h3 class="land-title"><a href="#/land/${land.id}">${land.title}</a></h3>
          <div class="land-metrics">
            <span class="metric"><strong>${land.perches}</strong> Perches</span>
            <span class="metric-divider">•</span>
            <span class="metric"><strong>${(land.perches / 160).toFixed(2)}</strong> Acres</span>
          </div>
          <div class="land-pricing">
            <div class="total-price">${formattedPrice}</div>
            <div class="ppp-price">${formattedPpp} / perch</div>
          </div>
        </div>
        <div class="land-card-footer">
          <button class="btn btn-sm btn-outline" onclick="window.location.hash='#/land/${land.id}'">View Details</button>
          <button class="btn btn-sm btn-primary" onclick="LandManagementSearch.reserveModal(${land.id})">Reserve</button>
        </div>
      </article>
    `;
  },

  renderSellLandForm() {
    return `
      <div class="sell-land-container">
        <h2>Post New Land Advertisement</h2>
        <p>List your property for thousands of active buyers across Sri Lanka and overseas.</p>

        <form id="sell-land-form" onsubmit="LandManagementSearch.handleCreateListing(event)">
          <div class="form-group">
            <label>Property Title</label>
            <input type="text" id="post-title" required placeholder="e.g. 20 Perches Prime Land in Rajagiriya" />
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label>District</label>
              <select id="post-district" required>
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kandy">Kandy</option>
                <option value="Galle">Galle</option>
              </select>
            </div>
            <div class="form-group">
              <label>City / Town</label>
              <input type="text" id="post-city" required placeholder="e.g. Rajagiriya" />
            </div>
            <div class="form-group">
              <label>Land Type</label>
              <select id="post-type" required>
                <option value="Residential">Residential</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Commercial">Commercial</option>
                <option value="Coconut">Coconut</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Extent in Perches</label>
              <input type="number" id="post-perches" step="0.1" required placeholder="e.g. 20" oninput="LandManagementSearch.calcPerchRate()" />
            </div>
            <div class="form-group">
              <label>Total Price (LKR)</label>
              <input type="number" id="post-price" required placeholder="e.g. 18000000" oninput="LandManagementSearch.calcPerchRate()" />
            </div>
          </div>

          <div id="perch-rate-preview" class="notice-info">
            Estimated Rate: <strong id="calculated-ppp">Rs. 0</strong> per perch
          </div>

          <div class="form-group">
            <label>Description & Features</label>
            <textarea id="post-desc" rows="4" placeholder="Electricity, 20ft road access, tap water, clear deed..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary">Submit Listing for Review</button>
        </form>
      </div>
    `;
  },

  calcPerchRate() {
    const p = parseFloat(document.getElementById('post-perches')?.value || 0);
    const pr = parseFloat(document.getElementById('post-price')?.value || 0);
    const display = document.getElementById('calculated-ppp');
    if (display && p > 0 && pr > 0) {
      const rate = Math.round(pr / p);
      display.innerText = 'Rs. ' + rate.toLocaleString() + ' / perch';
    }
  },

  applyFilters(e) {
    e.preventDefault();
    // Fetch from backend API
  }
};
